package main

var (
	db = DB.Connect(ENV(DATABASE_URL))
)

type __get_html_component_type struct {
	Value string
}

func __get_html() {
	rows = db.query(`select * from "TABLE" limit 1`)
	row = rows[0]
	t.Render("__get", __get_html_component_type{ Value: row.name })
}

func __get_hello_html() {
	t.Render("__get_hello", 0)
}

func __get_entity__id__friends_html() {
	t.Render("__get__id__friends", 0)
}

func main() {
	e.get("/", func (r) {
		if (r.header.accept == "application/html") {
			return __get_html()
		}
		return 404
	})
	e.get("/hello", func (r) {
		if (r.header.accept == "application/html") {
			return __get_hello_html()
		}
		return 404
	})
	e.get("/entity/{id}/friends", func (r) {
		if (r.header.accept == "application/html") {
			return __get_entity__id__friends_html()
		}
		return 404
	})

	e.start(4000)
}

