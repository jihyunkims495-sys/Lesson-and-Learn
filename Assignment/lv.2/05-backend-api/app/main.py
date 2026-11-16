"""학습용 게시판 API. PostgreSQL 연결과 테이블 생성은 별도 init_db 명령으로 수행."""
import os
import time
from datetime import datetime, timedelta, timezone
from typing import Annotated
import jwt
from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy import create_engine, select, func
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from .models import Base, User, Post
from .security import JWT_SECRET, password_hash, dummy_hash

DATABASE_URL=os.environ.get('DATABASE_URL','')
if not DATABASE_URL:
    raise RuntimeError('DATABASE_URL 설정 필요')
engine=create_engine(DATABASE_URL,pool_pre_ping=True)
SessionLocal=sessionmaker(engine,expire_on_commit=False)

class Signup(BaseModel):
    email:EmailStr
    password:str=Field(min_length=8,max_length=128)
class Login(BaseModel):
    email:EmailStr
    password:str=Field(min_length=1,max_length=128)
class UserOut(BaseModel):
    model_config=ConfigDict(from_attributes=True)
    id:int
    email:EmailStr
    role:str
class TokenOut(BaseModel):
    access_token:str
    token_type:str='bearer'
    expires_in:int=1800
class PostInput(BaseModel):
    title:str=Field(min_length=1,max_length=120)
    body:str=Field(min_length=1,max_length=10000)
    @field_validator('title','body')
    @classmethod
    def trim_text(cls,value:str)->str:
        if not value.strip(): raise ValueError('공백만 입력할 수 없습니다')
        return value.strip()
class PostOut(PostInput):
    model_config=ConfigDict(from_attributes=True)
    id:int
    author_id:int
class PostList(BaseModel):
    items:list[PostOut]
    total:int
    offset:int
    limit:int
class ErrorBody(BaseModel):
    code:str
    message:str
class ErrorOut(BaseModel):
    error:ErrorBody

app=FastAPI(title='Learning Board API',version='1.0.0',responses={401:{'model':ErrorOut},403:{'model':ErrorOut},404:{'model':ErrorOut},405:{'model':ErrorOut,'headers':{'Allow':{'description':'Supported HTTP methods','schema':{'type':'string'}}}},409:{'model':ErrorOut},422:{'model':ErrorOut},503:{'model':ErrorOut}})
app.add_middleware(CORSMiddleware,allow_origins=os.environ.get('ALLOWED_ORIGINS','http://localhost:3000').split(','),allow_credentials=False,allow_methods=['GET','POST','PUT','DELETE'],allow_headers=['Authorization','Content-Type'])
@app.middleware('http')
async def timing(request,call_next):
    start=time.perf_counter()
    response=await call_next(request)
    response.headers['X-Process-Time']=str(round(time.perf_counter()-start,6))
    response.headers['X-Content-Type-Options']='nosniff'
    # 공개 정적 응답의 명시적 캐시 정책은 보존한다.
    if 'Cache-Control' not in response.headers:
        response.headers['Cache-Control']='no-store'
    return response
def error_response(status:int,code:str,message:str,headers:dict[str,str]|None=None):
    response_headers=dict(headers or {})
    if status==401 and not any(name.lower()=='www-authenticate' for name in response_headers):
        response_headers['WWW-Authenticate']='Bearer'
    return JSONResponse(status_code=status,content={'error':{'code':code,'message':message}},headers=response_headers)
@app.exception_handler(StarletteHTTPException)
async def http_error(request,exc): return error_response(exc.status_code,str(exc.status_code),str(exc.detail),exc.headers)
@app.exception_handler(RequestValidationError)
async def validation_error(request,exc): return error_response(422,'VALIDATION_ERROR','입력 형식이 올바르지 않습니다')
@app.exception_handler(SQLAlchemyError)
async def database_error(request,exc): return error_response(503,'DATABASE_ERROR','데이터베이스 요청 처리 실패')
def db_session():
    with SessionLocal() as db: yield db
DB=Annotated[Session,Depends(db_session)]
bearer=HTTPBearer(auto_error=False)
def current_user(db:DB,credential:Annotated[HTTPAuthorizationCredentials|None,Depends(bearer)]=None):
    if not credential: raise HTTPException(401,'인증이 필요합니다')
    try:
        payload=jwt.decode(credential.credentials,JWT_SECRET,algorithms=['HS256'],issuer='learning-board',audience='learning-board-client',options={'require':['exp','iat','sub','iss','aud']})
        uid=int(payload['sub'])
    except (jwt.PyJWTError,ValueError,KeyError,TypeError): raise HTTPException(401,'유효하지 않거나 만료된 토큰')
    user=db.get(User,uid)
    if not user: raise HTTPException(401,'사용자를 찾을 수 없습니다')
    return user
Actor=Annotated[User,Depends(current_user)]
def find_post(db:Session,pid:int):
    post=db.get(Post,pid)
    if not post: raise HTTPException(404,'게시글을 찾을 수 없습니다')
    return post
def authorize(post:Post,user:User):
    if post.author_id!=user.id and user.role!='admin': raise HTTPException(403,'작성자 또는 관리자만 변경할 수 있습니다')

@app.get('/health',tags=['operations'])
def health(db:DB):
    db.execute(select(1))
    return {'status':'ok'}
@app.post('/auth/signup',response_model=UserOut,status_code=201,tags=['auth'])
def signup(data:Signup,db:DB):
    user=User(email=str(data.email).lower(),password_hash=password_hash.hash(data.password))
    db.add(user)
    try: db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409,'이미 등록된 이메일입니다')
    db.refresh(user)
    return user
@app.post('/auth/login',response_model=TokenOut,tags=['auth'])
def login(data:Login,db:DB):
    user=db.scalar(select(User).where(User.email==str(data.email).lower()))
    valid=password_hash.verify(data.password,user.password_hash if user else dummy_hash)
    if not user or not valid: raise HTTPException(401,'이메일 또는 비밀번호 오류')
    now=datetime.now(timezone.utc)
    token=jwt.encode({'sub':str(user.id),'iat':now,'exp':now+timedelta(minutes=30),'iss':'learning-board','aud':'learning-board-client'},JWT_SECRET,algorithm='HS256')
    return TokenOut(access_token=token)
@app.get('/auth/me',response_model=UserOut,tags=['auth'])
def me(user:Actor): return user
@app.get('/posts',response_model=PostList,tags=['posts'])
def list_posts(db:DB,offset:int=Query(0,ge=0),limit:int=Query(20,ge=1,le=100)):
    return {'items':db.scalars(select(Post).order_by(Post.id.desc()).offset(offset).limit(limit)).all(),'total':db.scalar(select(func.count()).select_from(Post)),'offset':offset,'limit':limit}
@app.get('/posts/{post_id}',response_model=PostOut,tags=['posts'])
def read_post(post_id:int,db:DB): return find_post(db,post_id)
@app.post('/posts',response_model=PostOut,status_code=201,tags=['posts'])
def create_post(data:PostInput,db:DB,user:Actor):
    post=Post(**data.model_dump(),author_id=user.id);db.add(post);db.commit();db.refresh(post);return post
@app.put('/posts/{post_id}',response_model=PostOut,tags=['posts'])
def update_post(post_id:int,data:PostInput,db:DB,user:Actor):
    post=find_post(db,post_id);authorize(post,user)
    post.title=data.title;post.body=data.body;db.commit();db.refresh(post);return post
@app.delete('/posts/{post_id}',status_code=204,tags=['posts'])
def delete_post(post_id:int,db:DB,user:Actor):
    post=find_post(db,post_id);authorize(post,user);db.delete(post);db.commit()

# 운영 항목의 비동기/업로드 데모: 저장 대신 제한된 텍스트 미리보기. 사용자 파일 경로를 사용하지 않는다.
@app.post('/uploads/preview',tags=['operations'],openapi_extra={
    'requestBody': {'required': True, 'content': {'text/plain': {'schema': {'type':'string','format':'binary'}}}},
    'responses': {'413': {'description':'64KiB 제한 초과'}, '415': {'description':'텍스트 형식 아님'}}
})
async def preview(request:Request,user:Actor):
    if request.headers.get('content-type','').split(';')[0]!='text/plain': raise HTTPException(415,'텍스트 파일만 지원합니다')
    data=bytearray()
    async for chunk in request.stream():
        if len(data)+len(chunk)>65536: raise HTTPException(413,'64KiB 제한 초과')
        data.extend(chunk)
    try: text=data.decode('utf-8')
    except UnicodeDecodeError: raise HTTPException(422,'UTF-8 파일이 필요합니다')
    return {'bytes':len(data),'preview':text[:200]}
# 캐싱은 인증/게시글에 적용하지 않고 공개 정적 메타데이터에만 적용.
@app.get('/meta',tags=['operations'])
def meta():
    return JSONResponse({'service':'learning-board','version':'1.0.0'},headers={'Cache-Control':'public, max-age=60'})
