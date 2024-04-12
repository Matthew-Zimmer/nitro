package main

import (
	"bytes"
	"database/sql"
	"encoding/binary"
	"math"
	"net/http"
	"os"

	"github.com/labstack/echo/v4"
	_ "github.com/lib/pq"
)

type Database struct {
	conn *sql.DB
}

var (
	c0_pre  = []byte{}
	c0_post = []byte{}
	c1_text = []byte{}
	c2_text = []byte{}
)

type Component = func(echo.Context) error

func WriteBytes(c echo.Context, bytes []byte) error {
	_, err := c.Response().Write(bytes)
	return err
}

func c0(children Component) Component {
	return func(c echo.Context) error {
		if err := WriteBytes(c, c0_pre); err != nil {
			return err
		}
		if err := children(c); err != nil {
			return err
		}
		if err := WriteBytes(c, c0_post); err != nil {
			return err
		}
		return nil
	}
}

func c3(id string) Component {
	return func(c echo.Context) error {
		if err := WriteBytes(c, c2_text); err != nil {
			return err
		}
		return nil
	}
}

func c4(ids []string) Component {
	return func(c echo.Context) error {
		for _, id := range ids {
			c3(id)(c)
		}
		return nil
	}
}

func get0(c echo.Context) error {
	ids := []string{"", ""} // from db
	if err := c0(c4(ids))(c); err != nil {
		return err
	}
	return nil
}

/*
instruction type is instruction & 110...0 >> 30

0: copy snippet   instruction ; copy snippets[Arg] to the response
1: copy data      instruction ; copy bytes[Arg] to the response
2: exec component instruction ; pop stack -> id, stream components[id] to response ; Arg is unused
3: push component instruction ; push Arg to stack
*/
var (
	snippets            = [][]byte{}
	instructions        = []uint32{}
	components          = [][]uint32{}
	stack               = []uint32{}
	arg_mask     uint32 = math.MaxUint32 >> 2
	kind_mask    uint32 = math.MaxUint32 ^ arg_mask
)

func stream_component(c echo.Context, component_id uint32, bytes [][]byte) error {
	c.Response().Header().Set(echo.HeaderContentType, echo.MIMETextHTMLCharsetUTF8)
	c.Response().WriteHeader(http.StatusOK)
	component := components[component_id]
	start := component[0]
	end := component[1]
	for i := start; i < end; i++ {
		ins := instructions[i]
		kind := (ins & kind_mask) >> 30
		arg := ins & arg_mask
		switch kind {
		case 0:
			c.Response().Write(snippets[arg])
		case 1:
			c.Response().Write(bytes[arg])
		case 2:
			var id uint32
			id, stack = stack[len(stack)-1], stack[:len(stack)-1]
			stream_component(c, id, bytes)
		case 3:
			stack = append(stack, arg)
		}
	}
	return nil
}

func load_components() {
	f, err := os.Open("main.tmpl.txt")
	if err != nil {
		panic(err)
	}
	defer f.Close()
	buf := new(bytes.Buffer)
	buf.ReadFrom(f)
	data := buf.Bytes()
	start := 0
	for i, b := range data {
		if b == 0 {
			snippet := make([]byte, i-start)
			copy(snippet, data[start:i])
			snippets = append(snippets, snippet)
			start = i + 1
		}
	}
	ins_file, err := os.Open("main.tmpl.ins")
	if err != nil {
		panic(err)
	}
	defer ins_file.Close()

	buf.Reset()
	buf.ReadFrom(ins_file)
	data = buf.Bytes()

	size := binary.LittleEndian.Uint32(data[0:4])
	components = make([][]uint32, size)
	var offset uint32 = 0
	for i := range size {
		start := i*4 + 4
		end := start + 4
		components[i] = make([]uint32, 2)
		len := binary.LittleEndian.Uint32(data[start:end])
		components[i][0] = offset
		components[i][1] = offset + len
		offset += len
	}

	n := uint32(len(data))
	instructions = make([]uint32, n/4-size-1)
	j := 0
	for i := (size + 1) * 4; i < n; i += 4 {
		instructions[j] = binary.LittleEndian.Uint32(data[i : i+4])
		j++
	}
}

type SQ0Cols struct {
	col2 string
}

func (db *Database) QuerySQ0(id string) []SQ0Cols {
	var obj SQ0Cols
	var objects []SQ0Cols

	rows, err := db.conn.Query(`select "col2"from "my_table"where "id" = $1`, id)
	if err != nil {
		panic("bad query: " + err.Error())
	}
	defer rows.Close()

	for rows.Next() {
		rows.Scan(&obj.col2)
		objects = append(objects, obj)
	}

	return objects

}

func page() [][]byte {
	ret := [][]byte{}

	return ret

}

func component() [][]byte {
	ret := [][]byte{}

	return ret

}

func headline() [][]byte {
	ret := [][]byte{}

	return ret

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

	load_components()

	e.GET("/click", func(c echo.Context) error {
		data := [][]byte{}
		return stream_component(c, 3, data)
	})

	e.GET("/nest", func(c echo.Context) error {
		data := [][]byte{}
		data = append(data, page()...)
		return stream_component(c, 4, data)
	})

	e.GET("/nest/nest", func(c echo.Context) error {
		data := [][]byte{}
		data = append(data, page()...)
		return stream_component(c, 6, data)
	})

	e.GET("/nest/nest/nest", func(c echo.Context) error {
		data := [][]byte{}
		data = append(data, page()...)
		return stream_component(c, 9, data)
	})

	e.GET("/db", func(c echo.Context) error {
		data := [][]byte{}
		data = append(data, page()...)
		return stream_component(c, 13, data)
	})

	e.GET("/row/:id", func(c echo.Context) error {
		id := ""
		if err := echo.PathParamsBinder(c).String("id", &id).BindError(); err != nil {
			return c.String(http.StatusBadRequest, "bad request")
		}
		rows := db.QuerySQ0(id)
		col2 := rows[0].col2
		data := [][]byte{}
		data = append(data, []byte(col2))
		return stream_component(c, 15, data)
	})

	e.Logger.Fatal(e.Start(":4000"))
}
