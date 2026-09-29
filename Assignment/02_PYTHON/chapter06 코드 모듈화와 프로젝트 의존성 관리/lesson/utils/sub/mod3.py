# mod1.py에 있는 VERSION 불러오기!
# from chapter06 코드 모듈화와 프로젝트 의존성 관리.mod1 import VERSION  # 불러오고 싶은 모듈이 있는 전체 경로로 접근!!!!

from mod1 import VERSION


def divide(num1,num2):
    return num1 / num2


def print_version():
    print("프로그램 버전:", VERSION)