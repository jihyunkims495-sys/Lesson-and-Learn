while True :  #무한 루프(반복)
    print("아무 메세지 입력(q-종료):",end="")
    message = input() #메세지를 입력받기

    if message == "q" :
        print("종료합니다.")
        break #반복 중단

print("입력 메세지:",message)   