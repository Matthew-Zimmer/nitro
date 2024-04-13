package main

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/go-playground/validator"

	"github.com/labstack/echo/v4"
	_ "github.com/lib/pq"

	// raw imports

	raw_uuid "github.com/google/uuid"
)

// raw sources

func uuid() string {
	return raw_uuid.New().String()
}

type create_item_input = struct {
	Name string `form:"name" validate:"required"`
}

// start standard prelude

type Validator struct {
	validator *validator.Validate
}

func (cv *Validator) Validate(i interface{}) error {
	if err := cv.validator.Struct(i); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return nil
}

var (
	db *sql.DB = nil
)

type Component func(echo.Context) error
type Iterator[T any] func(func(T) error) (bool, error)

func WriteBytes(c echo.Context, bytes []byte) error {
	_, err := c.Response().Write(bytes)
	return err
}

func WriteString(c echo.Context, value string) error {
	return WriteBytes(c, []byte(value))
}

func WriteInteger(c echo.Context, value int) error {
	return WriteString(c, strconv.Itoa(value))
}

func empty[T any]() Iterator[T] {
	return func(f func(T) error) (bool, error) {
		return false, nil
	}
}

func seq(n int) Iterator[int] {
	c := 0
	return func(f func(int) error) (bool, error) {
		if c >= n {
			return true, nil
		} else {
			err := f(c)
			c++
			return c >= n, err
		}
	}
}

func iter_map[A any, B any](iter Iterator[A], f func(A) B) Iterator[B] {
	var a A
	extractor := func(x A) error {
		a = x
		return nil
	}
	return func(g func(B) error) (bool, error) {
		done, err := iter(extractor)
		if done || err != nil {
			return true, err
		}
		return false, g(f(a))
	}
}

func iter_filter[T any](iter Iterator[T], f func(T) bool) Iterator[T] {
	var a T
	extractor := func(x T) error {
		a = x
		return nil
	}
	return func(g func(T) error) (bool, error) {
		for {
			done, err := iter(extractor)
			if done || err != nil {
				return true, err
			}
			if f(a) {
				break
			}
		}
		return false, g(a)
	}
}

func exhaust[T any](iter Iterator[T], f func(T) error) error {
	for {
		done, err := iter(f)
		if err != nil {
			return err
		}
		if done {
			return nil
		}
	}
}

func collect[T any](iter Iterator[T]) ([]T, error) {
	l := []T{}
	err := exhaust(iter, func(x T) error {
		l = append(l, x)
		return nil
	})
	return l, err
}

// end standard prelude

// start non http definitions

type item struct {
	Id   string
	Name string
}

func page(title string, children Component) Component {
	return func(c echo.Context) error {
		return (func() error {
			WriteString(c, "<!doctype html><html")
			WriteString(c, ">")
			(func() error {
				WriteString(c, "<head")
				WriteString(c, ">")
				(func() error {
					WriteString(c, "<script")
					WriteString(c, " src=\"")
					WriteString(c, "https://unpkg.com/htmx.org@1.9.11")
					WriteString(c, "\"")
					WriteString(c, ">")
					WriteString(c, "</script>")
					return nil
				})()
				(func() error {
					WriteString(c, "<script")
					WriteString(c, " src=\"")
					WriteString(c, "https://cdn.tailwindcss.com")
					WriteString(c, "\"")
					WriteString(c, ">")
					WriteString(c, "</script>")
					return nil
				})()
				(func() error {
					WriteString(c, "<title")
					WriteString(c, ">")
					WriteString(c, title)
					WriteString(c, "</title>")
					return nil
				})()
				WriteString(c, "</head>")
				return nil
			})()
			(func() error {
				WriteString(c, "<body")
				WriteString(c, " hx-boost=\"")
				WriteString(c, "true")
				WriteString(c, "\"")
				WriteString(c, ">")
				children(c)
				WriteString(c, "</body>")
				return nil
			})()
			WriteString(c, "</html>")
			return nil
		})()
	}
}

func _0() Iterator[struct {
	Id   string
	Name string
}] {
	var obj struct {
		Id   string
		Name string
	}
	rows, err := db.Query(`select id, name from item`)
	if err != nil {
		panic("bad query: " + err.Error())
	}
	return func(f func(struct {
		Id   string
		Name string
	}) error) (bool, error) {
		if rows.Next() {
			rows.Scan(&obj.Id, &obj.Name)
			return false, f(obj)
		} else {
			rows.Close()
			return true, nil
		}
	}
}

func _1(n_0 string, n_1 string) error {
	_, err := db.Exec(`insert into item (id, name) values ($1, $2)`, n_0, n_1)
	if err != nil {
		panic("bad query: " + err.Error())
	}
	return nil

}

// end non http definitions

func main() {
	connStr := "postgresql://root:password@localhost:5432?sslmode=disable"
	conn, err := sql.Open("postgres", connStr)
	if err != nil {
		panic("Could not connect to the database at " + connStr)
	}
	db = conn
	defer db.Close()

	e := echo.New()
	e.Validator = &Validator{validator: validator.New()}

	e.Pre(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			path := c.Request().URL.Path
			if path[len(path)-1] != '/' {
				c.Request().URL.Path += "/"
			}
			return next(c)
		}
	})

	// start http definitions

	e.GET("/", func(c echo.Context) error {

		return page("hello", func(c echo.Context) error {
			return (func() error {
				return (func() error {
					WriteString(c, "<h1")
					WriteString(c, ">")
					WriteString(c, "Nitro Rules")
					WriteString(c, "</h1>")
					return nil
				})()
			})()
		})(c)
	})

	e.GET("/:msg/", func(c echo.Context) error {
		msg := ""
		if err := echo.PathParamsBinder(c).String("msg", &msg).BindError(); err != nil {
			return c.String(http.StatusBadRequest, "bad request")
		}

		return page(msg, func(c echo.Context) error {
			return (func() error {
				return (func() error {
					WriteString(c, "<h1")
					WriteString(c, ">")
					WriteString(c, "Nitro Rules")
					WriteString(c, "</h1>")
					return nil
				})()
			})()
		})(c)
	})

	e.GET("/items/", func(c echo.Context) error {

		return page("items", func(c echo.Context) error {
			return (func() error {
				(func() error {
					WriteString(c, "<a")
					WriteString(c, " href=\"")
					WriteString(c, "/create-item")
					WriteString(c, "\"")
					WriteString(c, ">")
					WriteString(c, "Create New Item")
					WriteString(c, "</a>")
					return nil
				})()
				return exhaust(_0(), func(x struct {
					Id   string
					Name string
				}) error {
					return (func() error {
						return (func() error {
							WriteString(c, "<h1")
							WriteString(c, " class=\"")
							WriteString(c, "flex flex-row gap-2")
							WriteString(c, "\"")
							WriteString(c, ">")
							(func() error {
								WriteString(c, "<div")
								WriteString(c, ">")
								WriteString(c, (x.Id))
								WriteString(c, "</div>")
								return nil
							})()
							WriteString(c, "-")
							(func() error {
								WriteString(c, "<div")
								WriteString(c, ">")
								WriteString(c, (x.Name))
								WriteString(c, "</div>")
								return nil
							})()
							WriteString(c, "</h1>")
							return nil
						})()
					})()
				})
			})()
		})(c)
	})

	e.GET("/create-item/", func(c echo.Context) error {

		return page("Create Item", func(c echo.Context) error {
			return (func() error {
				return (func() error {
					WriteString(c, "<form")
					WriteString(c, " hx-post=\"")
					WriteString(c, "/api/item")
					WriteString(c, "\"")
					WriteString(c, " class=\"")
					WriteString(c, "flex flex-col gap-2 border p-10 border-black")
					WriteString(c, "\"")
					WriteString(c, ">")
					(func() error {
						WriteString(c, "<h1")
						WriteString(c, ">")
						WriteString(c, "Create new Item")
						WriteString(c, "</h1>")
						return nil
					})()
					(func() error {
						WriteString(c, "<fieldset")
						WriteString(c, " class=\"")
						WriteString(c, "flex flex-col gap-1 invalid:after:content-[attr(err)] after:text-red-500")
						WriteString(c, "\"")
						WriteString(c, " err=\"")
						WriteString(c, "Please enter a name")
						WriteString(c, "\"")
						WriteString(c, ">")
						(func() error {
							WriteString(c, "<label")
							WriteString(c, " for=\"")
							WriteString(c, "name")
							WriteString(c, "\"")
							WriteString(c, ">")
							WriteString(c, "Name")
							WriteString(c, "</label>")
							return nil
						})()
						(func() error {
							WriteString(c, "<input")
							WriteString(c, " id=\"")
							WriteString(c, "name")
							WriteString(c, "\"")
							WriteString(c, " class=\"")
							WriteString(c, "border p-2 invalid:border-red-500")
							WriteString(c, "\"")
							WriteString(c, " name=\"")
							WriteString(c, "name")
							WriteString(c, "\"")
							WriteString(c, " required=\"")
							WriteString(c, "true")
							WriteString(c, "\"")
							WriteString(c, " />")
							return nil
						})()
						WriteString(c, "</fieldset>")
						return nil
					})()
					(func() error {
						WriteString(c, "<button")
						WriteString(c, ">")
						WriteString(c, "Create")
						WriteString(c, "</button>")
						return nil
					})()
					WriteString(c, "</form>")
					return nil
				})()
			})()
		})(c)
	})

	e.POST("/api/item/", func(c echo.Context) error {

		var payload create_item_input
		if err := c.Bind(&payload); err != nil {
			return c.String(http.StatusBadRequest, "bad request")
		}
		if err = c.Validate(payload); err != nil {
			return err
		}

		return (func() error {
			return _1(uuid(), (payload.Name))
		})()
	})

	// end http definitions

	e.Logger.Fatal(e.Start(":4000"))
}
