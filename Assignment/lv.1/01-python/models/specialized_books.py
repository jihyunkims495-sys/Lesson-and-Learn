"""하위 도서 클래스 모듈."""

from models.base_book import Book


class PrintedBook(Book):
    """일반 단행본 클래스."""

    def __init__(self, title, author, isbn, pages):
        super().__init__(title, author, isbn)
        self.__pages = pages

    @property
    def pages(self):
        return self.__pages

    def to_dict(self):
        info = super().to_dict()
        info.update({"유형": "일반 단행본", "페이지": self.__pages})
        return info

    def show_info(self):
        status = "대여 중" if self.is_rented else "대여 가능"
        return (
            f"[일반 단행본] {self.title} | 저자: {self.author} | "
            f"ISBN: {self.isbn} | {self.__pages}쪽 | {status}"
        )


class Ebook(Book):
    """전자도서 클래스."""

    def __init__(self, title, author, isbn, file_format):
        super().__init__(title, author, isbn)
        self.__file_format = file_format

    @property
    def file_format(self):
        return self.__file_format

    def to_dict(self):
        info = super().to_dict()
        info.update({"유형": "전자도서", "파일형식": self.__file_format})
        return info

    def show_info(self):
        status = "대여 중" if self.is_rented else "대여 가능"
        return (
            f"[전자도서] {self.title} | 저자: {self.author} | "
            f"ISBN: {self.isbn} | 형식: {self.__file_format} | {status}"
        )
