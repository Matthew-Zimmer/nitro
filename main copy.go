package main

import (
	"database/sql"
	"net/http"
	"unsafe"

	"github.com/labstack/echo/v4"
	_ "github.com/lib/pq"
)

var (
	_b0 = []byte(`<html><head><title>`)
	_b1 = []byte(`</title></head><body>`)
	_b2 = []byte(`</body></html>`)
)

type Iterator[T any] = func() (bool, T)

type Database struct {
	conn *sql.DB
}

type Component = func(echo.Context) error

func WriteBytes(c echo.Context, bytes []byte) error {
	_, err := c.Response().Write(bytes)
	return err
}

func _c0(items string) Component {

	return func(c echo.Context) error {
		if err := WriteBytes(c, []byte(items)); err != nil {
			return err
		}
		return nil
	}
}

type _2 struct {
	id string
}

func (db *Database) _2() func() (bool, _2) {
	rows, err := db.conn.Query(`select id item`)
	if err != nil {
		panic("bad query: " + err.Error())
	}

	return func() (bool, _2) {
		var obj _2
		next := rows.Next()
		if next {
			rows.Scan(&obj.id)
			return true, obj
		}
		rows.Close()
		return false, obj
	}
}

func iter_map[T any, R any](iter Iterator[T], fn func(T) R) Iterator[R] {
	return func() (bool, R) {
		done, x := iter()
		if done {
			return done, *(*R)(unsafe.Pointer(&x))
		}
		return false, fn(x)
	}
}

func iter_filter[T any](iter Iterator[T], fn func(T) bool) Iterator[T] {
	return func() (bool, T) {
		var done bool
		var x T
		for done, x = iter(); done; {
			if done {
				return done, x
			}
			if !fn(x) {
				break
			}
		}
		return done, x
	}
}

func iter_skip[T any](iter Iterator[T], n uint32) Iterator[T] {
	count := uint32(0)
	return iter_filter(iter, func(_ T) bool {
		count++
		return count <= n
	})
}

func iter_fill[T any](n uint32, value T) Iterator[T] {
	count := uint32(0)
	return func() (bool, T) {
		count++
		if count > n {
			return true, value
		}
		return false, value
	}
}

func iter_seq[T int](n uint32) Iterator[T] {
	count := uint32(0)
	return func() (bool, T) {
		count++
		if count > n {
			return true, T(0)
		}
		return false, T(count - 1)
	}
}

func iter_concat[T any](first Iterator[T], last Iterator[T]) Iterator[T] {
	used := false
	return func() (bool, T) {
		if used {
			return last()
		} else {
			done, x := first()
			if done {
				used = true
				return last()
			}
			return done, x
		}
	}
}

func iter_apply[T any](iter Iterator[T], fn func(T) error) error {
	for done, x := iter(); done; {
		if err := fn(x); err != nil {
			return err
		}
	}
	return nil
}

func apply_component_iterator(ctx echo.Context) func(Component) error {
	return func(c Component) error {
		return c(ctx)
	}
}

func page2(title string) Component {
	return func(c echo.Context) error {
		if err := WriteBytes(c, _b0); err != nil {
			return err
		}
		if err := WriteBytes(c, []byte(title)); err != nil {
			return err
		}
		if err := WriteBytes(c, _b1); err != nil {
			return err
		}
		return nil
	}
}

func c3(iter Iterator[string]) Component {
	nextIter := iter_map(iter, page2)
	return func(c echo.Context) error {
		if err := iter_apply(nextIter, apply_component_iterator(c)); err != nil {
			return err
		}
		return nil
	}
}

func page(title string, children Component) Component {

	return func(c echo.Context) error {
		if err := WriteBytes(c, _b0); err != nil {
			return err
		}
		if err := WriteBytes(c, []byte(title)); err != nil {
			return err
		}
		if err := WriteBytes(c, _b1); err != nil {
			return err
		}
		if err := children(c); err != nil {
			return err
		}
		if err := WriteBytes(c, _b2); err != nil {
			return err
		}
		return nil
	}
}

func main() {
	connStr := "postgresql://root:password@localhost:5432?sslmode=disable"

	e := echo.New()

	conn, err := sql.Open("postgres", connStr)
	if err != nil {
		panic("Could not connect to the database at " + connStr)
	}
	db := Database{conn}
	defer db.conn.Close()

	e.Pre(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			path := c.Request().URL.Path
			if path[len(path)-1] != '/' {
				c.Request().URL.Path += "/"
			}
			return next(c)
		}
	})

	e.GET("/items/", func(c echo.Context) error {

		if err := echo.PathParamsBinder(c).BindError(); err != nil {
			return c.String(http.StatusBadRequest, "bad request")
		}

		msg := "Items"
		items := db._1()
		if err := page(msg, _c0(items))(c); err != nil {
			return err
		}
		return nil
	})

	e.Logger.Fatal(e.Start(":4000"))
}
