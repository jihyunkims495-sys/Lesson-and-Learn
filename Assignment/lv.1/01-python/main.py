# 도서 관리 CLI 

from collections import Counter
from datetime import datetime

from models.specialized_books import Ebook, PrintedBook
from utils.helpers import (
    find_book_by_isbn,
    get_menu_choice,
    get_non_blank_input,
    get_positive_int,
    validate_isbn,
)


books = []


book_details = {}


isbn_set = set()


rental_history = []


def show_menu():
    
    print("\n=== 도서 관리 시스템 ===")
    print("1. 도서 등록")
    print("2. 전체 도서 조회")
    print("3. 도서 검색")
    print("4. 대여/반납 처리")
    print("5. 종료")
    print("6. 통계 조회 (심화)")


def register_book():
    
    print("\n[도서 등록]")
    print("1. 일반 단행본")
    print("2. 전자도서")
    book_type = get_menu_choice({1, 2})

    title = get_non_blank_input("도서명: ")
    author = get_non_blank_input("저자: ")

    while True:
        isbn = get_non_blank_input("ISBN: ")
        is_valid, message = validate_isbn(isbn, isbn_set)
        if is_valid:
            break
        print(message)

    if book_type == 1:
        pages = get_positive_int("페이지 수: ")
        book = PrintedBook(title, author, isbn, pages)
    else:
        file_format = get_non_blank_input("파일 형식(PDF/EPUB 등): ")
        book = Ebook(title, author, isbn, file_format)

    books.append(book)
    isbn_set.add(isbn)
    book_details[isbn] = book.to_dict()
    print(f"'{title}' 도서가 등록되었습니다.")

# 조회
def show_all_books():
    
    print("\n[전체 도서 조회]")
    if not books:
        print("등록된 도서가 없습니다.")
        return

    for index, book in enumerate(books, start=1):
        print(f"{index}. {book.show_info()}")

# 검색
def search_books():
    
    print("\n[도서 검색]")
    keyword = get_non_blank_input("검색어(도서명/저자/ISBN): ").lower()

    results = []
    for book in books:
        if (
            keyword in book.title.lower()
            or keyword in book.author.lower()
            or keyword in book.isbn.lower()
        ):
            results.append(book)

    if not results:
        print("검색 결과가 없습니다.")
        return

    for index, book in enumerate(results, start=1):
        print(f"{index}. {book.show_info()}")

# 대여/반납
def process_rental_return():
   
    print("\n[대여/반납 처리]")
    isbn = get_non_blank_input("ISBN: ")
    book = find_book_by_isbn(books, isbn)

    if book is None:
        print("해당 ISBN의 도서가 존재하지 않습니다.")
        return

    print("1. 대여")
    print("2. 반납")
    action = get_menu_choice({1, 2})

    if action == 1:
        if not book.rent():
            print("이미 대여 중인 도서입니다.")
            return
        action_name = "대여"
        print(f"'{book.title}' 도서가 대여 처리되었습니다.")
    else:
        if not book.return_book():
            print("현재 대여 중이 아니므로 반납할 수 없습니다.")
            return
        action_name = "반납"
        print(f"'{book.title}' 도서가 반납 처리되었습니다.")

  
    book_details[isbn] = book.to_dict()

    
    rental_history.append((isbn, action_name, datetime.now()))


def show_statistics():
   
    print("\n[통계 조회]")
    rental_records = [record for record in rental_history if record[1] == "대여"]

    if not rental_records:
        print("아직 대여 이력이 없습니다.")
        return

    now = datetime.now()
    monthly_count = sum(
        1
        for _, action, processed_at in rental_history
        if action == "대여"
        and processed_at.year == now.year
        and processed_at.month == now.month
    )
    print(f"{now.year}년 {now.month}월 대여 건수: {monthly_count}건")

    counts = Counter(isbn for isbn, _, _ in rental_records)
    max_count = max(counts.values())
    top_isbns = [isbn for isbn, count in counts.items() if count == max_count]

    print(f"가장 많이 대여된 도서 (각 {max_count}회):")
    for isbn in top_isbns:
        book = find_book_by_isbn(books, isbn)
        if book is not None:
            print(f"- {book.title} (ISBN: {isbn})")


def main():
    
    while True:
        show_menu()
        choice = get_menu_choice({1, 2, 3, 4, 5, 6})

        if choice == 1:
            register_book()
        elif choice == 2:
            show_all_books()
        elif choice == 3:
            search_books()
        elif choice == 4:
            process_rental_return()
        elif choice == 5:
            print("도서 관리 시스템을 종료합니다.")
            break
        elif choice == 6:
            show_statistics()


if __name__ == "__main__":
    main()
