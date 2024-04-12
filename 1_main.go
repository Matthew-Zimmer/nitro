package main

var seq_10 = []int{0, 1, 2, 3, 4, 5, 6, 7, 8, 9}

func _4(x string) string {
	return WriteString(c, x)
}
func _2(x string) string {
	return _4(x)
}
func _1() string {
	return (func() []string {
		_ret := []string{}
		for _, x := range seq_10 {
			_ret = append(_ret, _2(x))
		}
		return _ret
	})()
}

var _7 = []byte("Add Stuff")

func _6() string {
	return WriteBytes(c, _7)
}
func _5() string {
	return _6()
}
func _0() string {
	return (func() string {
		_1()
		return _5()
	})()
}
func my_component() string {
	return _0()
}
