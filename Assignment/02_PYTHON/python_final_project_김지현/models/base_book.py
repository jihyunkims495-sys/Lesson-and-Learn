"""상위 도서 클래스 모듈."""


class Book:
    """모든 도서가 공통으로 가지는 속성과 기능을 정의하는 부모 클래스."""

    def __init__(self, title, author, isbn):
        # 외부에서 직접 값을 바꾸지 못하도록 프라이빗 변수로 관리한다.
        self.__title = title
        self.__author = author
        self.__isbn = isbn
        self.__is_rented = False

    @property
    def title(self):
        return self.__title

    @property
    def author(self):
        return self.__author

    @property
    def isbn(self):
        return self.__isbn

    @property
    def is_rented(self):
        return self.__is_rented

    def rent(self):
        """대여 가능한 경우 상태를 대여 중으로 변경한다."""
        if self.__is_rented:
            return False
        self.__is_rented = True
        return True

    def return_book(self):
        """대여 중인 경우 상태를 대여 가능으로 변경한다."""
        if not self.__is_rented:
            return False
        self.__is_rented = False
        return True

    def to_dict(self):
        """도서 상세 정보를 딕셔너리 형태로 반환한다."""
        return {
            "도서명": self.__title,
            "저자": self.__author,
            "ISBN": self.__isbn,
            "대여상태": "대여 중" if self.__is_rented else "대여 가능",
        }

    def show_info(self):
        """도서 상세 정보를 문자열로 반환한다. 자식 클래스에서 오버라이딩한다."""
        status = "대여 중" if self.__is_rented else "대여 가능"
        return f"[도서] {self.__title} | 저자: {self.__author} | ISBN: {self.__isbn} | {status}"
