

func f() {
	<html>
		<body>
			${for x in seq(10) {
				<h1>${x}</h1>
			}}
			<button>Add Stuff</button>
		</body>
	</html>
}

--------------------------------------------------------------

func _0(x string) {
	return func (c echo.Context) {
		WriteString(c, x)
	}
}

func _1(x string) {
	return func (c echo.Context) {
		WriteBytes(c, ...)
		_1(x)(c)
		WriteBytes(c, ...)
	}
}

func _2() {
	return func (c echo.Context) {
		exhaust(map(seq(0), func (x) { return _0(x)(c) }))
	}
}

func _3() {
	return func (c echo.Context) {
		WriteBytes(c, ...)
	}
}

func _4() {
	return func (c echo.Context) {
		WriteBytes(c, ...)
		_3()(c)
		WriteBytes(c, ...)
	}
}

func _5() {
	return func (c echo.Context) {
		WriteBytes(c, ...)
		_2()(c)
		_4()(c)
		WriteBytes(c, ...)
	}
}

func _6() {
	return func (c echo.Context) {
		WriteBytes(c, ...)
		_5()(c)
		WriteBytes(c, ...)
	}
}
