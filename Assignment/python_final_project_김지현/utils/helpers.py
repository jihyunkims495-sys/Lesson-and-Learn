"""입력 검증 및 포맷팅 등 공통 함수 모듈."""


def is_blank(value):
    """문자열이 비어 있거나 공백뿐인지 확인한다."""
    return not value.strip()


def get_non_blank_input(prompt):
    """공백이 아닌 문자열이 입력될 때까지 반복해서 입력받는다."""
    while True:
        value = input(prompt).strip()
        if not is_blank(value):
            return value
        print("공백은 입력할 수 없습니다. 다시 입력하세요.")


def get_menu_choice(valid_choices):
    """숫자 메뉴를 입력받고 ValueError 및 범위 오류를 방어한다."""
    while True:
        try:
            choice = int(input("메뉴를 선택하세요: ").strip())
        except ValueError:
            print("메뉴 번호는 숫자로 입력하세요.")
            continue

        if choice in valid_choices:
            return choice
        print(f"{sorted(valid_choices)} 중 하나를 입력하세요.")


def get_positive_int(prompt):
    """0보다 큰 정수를 입력받는다."""
    while True:
        try:
            value = int(input(prompt).strip())
        except ValueError:
            print("숫자로 입력하세요.")
            continue

        if value > 0:
            return value
        print("0보다 큰 숫자를 입력하세요.")


def validate_isbn(isbn, isbn_set):
    """ISBN의 공백 및 중복 여부를 검사한다."""
    if is_blank(isbn):
        return False, "ISBN은 공백일 수 없습니다."
    if isbn in isbn_set:
        return False, "이미 등록된 ISBN입니다."
    return True, ""


def find_book_by_isbn(books, isbn):
    """ISBN이 일치하는 도서 객체를 반환하고 없으면 None을 반환한다."""
    for book in books:
        if book.isbn == isbn:
            return book
    return None
