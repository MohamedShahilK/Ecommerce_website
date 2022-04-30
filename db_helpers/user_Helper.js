let dbCollection = require('../config/db_collection')
let mongo = require('../config/mongodb_setup')
let bcrypt = require('bcrypt')
let objectID = require('mongodb').ObjectId
const Razorpay = require('razorpay');

//We may need in other situations.So we globalize it
var instance = new Razorpay({
    key_id: 'rzp_test_eCRiypDBsbMsJY',
    key_secret: 'yYuIbFR1Ppnys00kpcqQy5c1',
});

module.exports = {

    userSignup: (userDetails) => {
        return new Promise(async (resolve, reject) => {

            userDetails.Password = await bcrypt.hash(userDetails.Password, 10)
            await mongo.get().collection(dbCollection.USER_COLLECTION).insertOne(userDetails)
            resolve(userDetails)
        })
    },

    userLogin: (userDetails) => {

        return new Promise(async (resolve, reject) => {
            let user = await mongo.get().collection(dbCollection.USER_COLLECTION).findOne({ Email: userDetails.Email })
            // let loginStatus = false
            let loginState = {}

            if (user) {
                bcrypt.compare(userDetails.Password, user.Password).then((status) => {
                    if (status) {
                        console.log('Login Success');
                        loginState.status = true
                        loginState.user = user
                        resolve(loginState)
                    }
                    else {
                        console.log('Login Failed');
                        resolve({ status: false })
                    }
                })
            } else {
                console.log('Login Failed');
                resolve({ status: false })
            }
        })
    },

    addToCart: (prodId, userId) => {

        return new Promise(async (resolve, reject) => {
            let prodObj = {
                item: objectID(prodId),
                quantity: 1
            }
            let cart = await mongo.get().collection(dbCollection.CART_COLLECTION).findOne({ user: objectID(userId) })


            if (cart) {

                //just checking
                let prodExist = cart.products.findIndex(objElem => objElem.item == prodId)

                if (prodExist == -1) {
                    mongo.get().collection(dbCollection.CART_COLLECTION).updateOne({ user: objectID(userId) },
                        {
                            $push: {
                                products: prodObj
                            }
                        }).then(() => {
                            resolve()
                        })
                } else {

                    mongo.get().collection(dbCollection.CART_COLLECTION).
                        updateOne({ user: objectID(userId), 'products.item': objectID(prodId) }, {
                            $inc: {
                                'products.$.quantity': 1
                            }
                        }).then(() => {
                            resolve()
                        })
                }
            } else {
                let cartObj = {
                    user: objectID(userId),
                    products: [prodObj]
                }

                mongo.get().collection(dbCollection.CART_COLLECTION).insertOne(cartObj).then(() => {
                    resolve()
                })
            }

            // if (cart == null) {

            //     let cartObj = {
            //         user: objectID(userId),
            //         item: [objectID(prodId)]
            //     }

            //     mongo.get().collection(dbCollection.CART_COLLECTION).insertOne(cartObj).then(() => {
            //         resolve()
            //     })
            // } else {

            //     mongo.get().collection(dbCollection.CART_COLLECTION).updateOne({user: objectID(userId)},
            //     {
            //         $push:{
            //             item : objectID(prodId)
            //         }
            //     }).then(()=>{
            //         resolve()
            //     })
            // }

        })
    },

    getProductsToCart: (userID) => {

        return new Promise(async (resolve, reject) => {

            let cartProducts = await mongo.get().collection(dbCollection.CART_COLLECTION).aggregate([
                {
                    $match: {
                        user: objectID(userID)
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',
                        user: objectID(userID)
                    }
                },
                {
                    $lookup: {
                        from: dbCollection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'productDetails'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1, user: 1,
                        product: { $arrayElemAt: ["$productDetails", 0] } //How to filter array records without unwind and We know there's always one match so we can get only one item $arrayElemAt "0"   
                    }
                }
            ]).toArray()
            // .then((re)=>{

            //     resolve(re)
            // })
            // resolve(cartProducts[0].product)
            // console.log(cartProducts)
            // console.log(cartProducts[0]);
            resolve(cartProducts)
        })
    },

    getCartCount: (userID) => {

        return new Promise((resolve, reject) => {

            mongo.get().collection(dbCollection.CART_COLLECTION).findOne({ user: objectID(userID) })
                .then((cart) => {
                    if (cart) {
                        var cartcount = cart.products.length
                        var quan = 0
                        for (var i = 0; i < cart.products.length; i++) {

                            quan = quan + cart.products[i].quantity
                        }
                    }

                    resolve(quan)
                    // resolve(cartcount)
                })
        })
    },

    // cartPdtRemove: (userId, prodId) => {

    //     return new Promise((resolve, reject) => {

    //         mongo.get().collection(dbCollection.CART_COLLECTION)
    //             .update({ user: objectID(userId) },
    //                 {
    //                     $pull: {
    //                         products: { item: objectID(prodId) }
    //                     }
    //                 }).then(() => {
    //                     resolve()
    //                 })
    //     })
    // }
    cartPdtRemove: (details) => {

        return new Promise((resolve, reject) => {
            console.log(details);
            mongo.get().collection(dbCollection.CART_COLLECTION)
                .update({ user: objectID(details.userID) },
                    {
                        $pull: {
                            products: { item: objectID(details.prodID) }
                        }
                    }).then(() => {
                        resolve()

                    })
        })
    },
    changeQuantity: (details) => {

        return new Promise((resolve, reject) => {

            //convert to integer
            count = parseInt(details.count)

            if (details.count == -1 && details.quantity == 1) {

                mongo.get().collection(dbCollection.CART_COLLECTION)
                    .updateOne({ _id: objectID(details.cartId), 'products.item': objectID(details.prodId) }, {
                        $pull: {
                            products: { item: objectID(details.prodId) }
                        }
                    }).then(() => {
                        resolve({ removePdt: true })
                    })
            } else {
                mongo.get().collection(dbCollection.CART_COLLECTION)
                    .updateOne({ _id: objectID(details.cartId), 'products.item': objectID(details.prodId) },
                        {
                            $inc: {
                                'products.$.quantity': count
                            }
                        }).then(() => {
                            // resolve(true)
                            resolve({ status: true }) //we changed it from the above one because we need a object structure   
                        })
            }
            // mongo.get().collection(dbCollection.CART_COLLECTION)
            //     .updateOne({ _id: objectID(details.cartId), 'products.item': objectID(details.prodId) },
            //         {
            //             $inc: {
            //                 'products.$.quantity': count
            //             }
            //         }).then(() => {
            //             resolve()
            //         })
        })
    },

    getTotalAmt: (userId) => {

        return new Promise(async (resolve, reject) => {

            let total = await mongo.get().collection(dbCollection.CART_COLLECTION).aggregate([
                {
                    $match: {
                        user: objectID(userId)
                    }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity',

                    }
                },
                {
                    $lookup: {
                        from: dbCollection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'productDetails'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1,
                        product: { $arrayElemAt: ["$productDetails", 0] } //How to filter array records without unwind and We know there's always one match so we can get only one item $arrayElemAt "0"   
                    }
                },
                // {
                //     $project: {
                //         total: { $sum: { $multiply: ['$quantity', {$toInt:'$product.price'}] } }
                //     }
                // }

                {
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', { $toInt: '$product.price' }] } }
                    }
                }

            ]).toArray()

            resolve(total[0].total)

            // console.log(total);
        })
    },

    getCartProductList: (userId) => {

        return new Promise((resolve, reject) => {

            mongo.get().collection(dbCollection.CART_COLLECTION).findOne({ user: objectID(userId) }).then((cart) => {
                resolve(cart.products)
            })
        })
    },

    placeOrder: (orderDetails, cartProducts, totalPrice) => {

        return new Promise((resolve, reject) => {
            var dateObj = new Date();
            var month = dateObj.getUTCMonth() + 1; //months from 1-12
            var day = dateObj.getUTCDate();
            var year = dateObj.getUTCFullYear();
            var hh = dateObj.getHours();
            var mm = dateObj.getMinutes();
            var ss = dateObj.getSeconds()

            let newdate = year + "/" + month + "/" + day;
            let newTime = hh + ":" + mm + ":" + ss;

            let status = orderDetails['payment-method'] == 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    address: orderDetails.address,
                    pincode: orderDetails.pincode,
                    mobile: orderDetails.mobile
                },
                user: objectID(orderDetails.userId),
                cartProducts: cartProducts,
                Total: totalPrice,
                paymentMethod: orderDetails['payment-method'],
                status: status,
                Date: newdate,
                Time: newTime
            }
            // console.log(orderObj);
            mongo.get().collection(dbCollection.ORDER_COLLECTION).insertOne(orderObj).then(async (response) => {
                await mongo.get().collection(dbCollection.CART_COLLECTION).deleteOne({ user: objectID(orderDetails.userId) })

                //resolve()

                resolve(response.insertedId)
                console.log(response.insertedId);//to get inserted id
            })
        })
    },

    getUserOrders: (userId) => {

        return new Promise(async (resolve, reject) => {

            let orders = await mongo.get().collection(dbCollection.ORDER_COLLECTION)
                .find({ user: objectID(userId) }).toArray()
            resolve(orders)

            // console.log(userId,orders);
        })
    },

    getViewOrderProducts: (orderId) => {

        return new Promise(async (resolve, reject) => {

            let orderProducts = await mongo.get().collection(dbCollection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        _id: objectID(orderId)
                    }
                },
                {
                    $unwind: '$cartProducts'
                },
                {
                    $project: {
                        item: '$cartProducts.item',
                        quantity: '$cartProducts.quantity',

                    }
                },
                {
                    $lookup: {
                        from: dbCollection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'productDetails'
                    }
                },
                {
                    $project: {
                        item: 1, quantity: 1,
                        product: { $arrayElemAt: ["$productDetails", 0] } //How to filter array records without unwind and We know there's always one match so we can get only one item $arrayElemAt "0"   
                    }
                }
            ]).toArray()
            console.log(orderProducts);
            resolve(orderProducts)
        })
    },

    generateRazorpay: (orderId, total) => {

        return new Promise(async (resolve, reject) => {

            // var instance = new Razorpay({ key_id: 'YOUR_KEY_ID', key_secret: 'YOUR_SECRET' })

            // instance.orders.create({
            //     amount: total,
            //     currency: "INR",
            //     receipt: ""+orderId,
            //     notes: {
            //         key1: "value3",
            //         key2: "value2"
            //     }
            // }, function (err, order) {
            //     console.log('New Order :', order);
            //     resolve(order)
            // })

            //Create an order on your server. (RazPay -- Step 1)
            let order = await instance.orders.create({
                amount: total,
                currency: "INR",
                receipt: "" + orderId,
                notes: {
                    key1: "value3",
                    key2: "value2"
                }
            })
            console.log('New Order :', order);
            resolve(order)
        })
    },

    verifyPayment: (details) => {

        return new Promise((resolve, reject) => {

            //In NodeJs, SHA256 algorithm used or accessed via a module called 'crypto' 
            //module 'crypto' is basically a tool to use SHA256 alogrithm( or other algorithm)

            const crypto = require('crypto');
            // const secret = 'yYuIbFR1Ppnys00kpcqQy5c1'
            //hash
            let hmac = crypto.createHmac('sha256', 'yYuIbFR1Ppnys00kpcqQy5c1')
            //Both order[id] and payment[razorpay_order_id] are same
            //here we use order[id] according to the documentation
            upd_hmac = hmac.update(details['order[id]'] + '|' + details['payment[razorpay_payment_id]'])
            //Encoding or construct a HMAC hex
            gen_hmac = hmac.digest('hex')

            console.log(details['payment[razorpay_signature]'],gen_hmac);
            //checking with razorpay_signature
            if (gen_hmac == details['payment[razorpay_signature]']) {

                resolve()
            } else {

                reject()
            }
        })
    },

    changePaymentStatus: (receiptOrderId) => {

        return new Promise((resolve, reject) => {

            mongo.get().collection(dbCollection.ORDER_COLLECTION).updateOne({ _id: objectID(receiptOrderId) },
                {
                    $set: {
                        status: 'placed'
                    }
                }).then(() => {
                    resolve()
                })
        })
    }

}