let app = new Vue({
    el: '#app',
    data: { //array to store array items
        products: [],
        cart: [], //store items added to cart here
        showCheckout: false, //state to show checkout page
        selectedTopic: "name", //default value
        selectedOrder: "ascend", //default value
        canOrder: false,
        searchQuery: "", //for search bar
        order: { //store order details here
            firstName: "",
            lastName: "",
            phone: "",
            lessonID: [],
            spaces: [],
        },
    },
    methods: {
        //add product to cart array and reduce slots by 1
        addItemToCart: function (product) { //product from products array is passed in as an argument
            this.cart.push(product);
            product.slots -= 1;
        },

        removeItemFromCart: function (product) {
            //find in products list, increment by 1, then remove from cart
            for (let i = 0; this.products.length; i++) {
                if (this.products[i].id == product.id) {
                    this.products[i].slots += 1;
                    //remove from cart
                    this.cart.pop(product);
                }
            }
        },

        toggleCheckoutPage: function () {
            // toggles showCheckout state to flip between checkout and not checkout
            this.showCheckout = !this.showCheckout;
        },

        clearFilters: function () {
            this.selectedTopic = "name";
            this.selectedOrder = "ascend";
            //reset products to original list order
        },

        canBeAddedToCart: function (product) {
            if (product.slots > 0) {
                return true;
            } else {
                return false;
            }
        },

        toggleOrderButton: function () {
            if (this.order.firstName == "" || this.order.lastName == "" || this.order.phone == "") {
                return true;
            } else {
                return false;
            }
        },

        //send order details to mongodb
        submitOrder: function () {
            let count = 1;
            let newSlots = [];

            //first step to sort out the lessonIDs and spaces
            for (let i = 0; i < this.sortCartById.length; i++) {
                if (this.sortCartById.length == 1) {
                    this.order.lessonID.push(this.sortCartById[i].id);
                    this.order.spaces.push(count);
                    count = 1;
                    break;
                } else {
                    j = i + 1;
                    for (j; j < this.sortCartById.length; j++) {
                        //go through the list and see how many duplicates there are
                        if (this.sortCartById[j].id == this.sortCartById[i].id) {
                            count++;  //increment how many of the same item is in the cart
                        } else {
                            break;
                        }

                    }
                    this.order.lessonID.push(this.sortCartById[i].id);
                    this.order.spaces.push(count);
                    newSlots.push(this.sortCartById[i].slots - count);  //to update to the database
                    count = 1;  //reset count for the next unique item in the cart
                    i = j - 1;  //skip the duplicates

                }

            }


            //second step to package the order details ready to send to server
            const name = (this.order.firstName + " " + this.order.lastName).trim();
            const fullOrder = {
                name,
                phone: this.order.phone,
                lessonID: this.order.lessonID,
                spaces: this.order.spaces,
            };

            //third step which is to send the order to the server
            fetch("http://localhost:3000/collections/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(fullOrder),
            }).then(
                function (response) {
                    return response.json();
                }
            )

            //fourth step update lesson space after order is placed
            //the order and size for both lessonIDs and spaces arrays will always be the same
            for (let i = 0; i < this.order.spaces; i++) {

                fetch("http://localhost:3000/collections/lessons/${ this.order.lessonID[i] }", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        slots: newSlots[i].slots,
                    }),
                }).then(
                    function (response) {
                        return response.json();
                    });

            }

            //reset the order details for new orders
            this.firstName = "";
            this.lastName = "";
            this.phone = "";
            this.lessonID = [];
            this.spaces = [];
            newSlots = [];
            this.cart = [];

            alert("Order submitted successfully!");
        },
    },
    computed: {
        cartItemCount: function () {
            return this.cart.length;
        },

        //keep count of how many of the same item is in the cart
        //useful for the lessonID and spaces arrays
        cartCount(id) {
            let count = 0;
            for (let i = 0; i < this.cart.length; i++) {
                if (this.cart[i] === id) {
                    count++;
                }
            }
            return count;
        },

        testSort: function () {
            let str = this.selectedTopic + " " + this.selectedOrder;
            return str;

        },

        filterLessons: function () {
            //search query
            const query = this.searchQuery.toLowerCase();
            if (!this.searchQuery) {
                return this.products.sort((a, b) => {
                    if (this.selectedOrder == "ascend") {
                        if (this.selectedTopic === "name") {
                            return a.name.localeCompare(b.name) * 1;
                        } else if (this.selectedTopic === "place") {
                            return a.place.localeCompare(b.place) * 1;
                        } else if (this.selectedTopic === "price") {
                            return (a.price - b.price) * 1;
                        } else if (this.selectedTopic === "slots") {
                            return (a.slots - b.slots) * 1;
                        }
                    } else {
                        if (this.selectedTopic === "name") {
                            return a.name.localeCompare(b.name) * -1;
                        } else if (this.selectedTopic === "place") {
                            return a.place.localeCompare(b.place) * -1;
                        } else if (this.selectedTopic === "price") {
                            return (a.price - b.price) * -1;
                        } else if (this.selectedTopic === "slots") {
                            return (a.slots - b.slots) * -1;
                        }
                    }

                });
            } else {
                return this.products.filter((lesson) => {
                    return (
                        lesson.name.toLowerCase().includes(this.searchQuery
                            .toLowerCase(query)) ||
                        lesson.place.toLowerCase().includes(this.searchQuery
                            .toLowerCase(query))
                    );
                }).sort((a, b) => {
                    if (this.selectedOrder == "ascend") {
                        if (this.selectedTopic === "name") {
                            return a.name.localeCompare(b.name) * 1;
                        } else if (this.selectedTopic === "place") {
                            return a.place.localeCompare(b.place) * 1;
                        } else if (this.selectedTopic === "price") {
                            return (a.price - b.price) * 1;
                        } else if (this.selectedTopic === "slots") {
                            return (a.slots - b.slots) * 1;
                        }
                    } else {
                        if (this.selectedTopic === "name") {
                            return a.name.localeCompare(b.name) * -1;
                        } else if (this.selectedTopic === "place") {
                            return a.place.localeCompare(b.place) * -1;
                        } else if (this.selectedTopic === "price") {
                            return (a.price - b.price) * -1;
                        } else if (this.selectedTopic === "slots") {
                            return (a.slots - b.slots) * -1;
                        }
                    }

                });

            }

        },

        sortCartById: function () {
            return this.cart.sort((a, b) => a.id - b.id);
        },
    },

    created: function () {
        fetch("http://localhost:3000/collections/lessons").then(
            function (response) {
                response.json().then(
                    function (json) {
                        app.products = json;
                    }
                )
            }
        )
    }
});
