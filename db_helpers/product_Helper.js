let dbCollection = require('../config/db_collection')
let mongo = require('../config/mongodb_setup')
let objectID = require('mongodb').ObjectId
const fs = require('fs')


module.exports = {

    add_product_to_database: (prod, callback) => {

        mongo.get().collection(dbCollection.PRODUCT_COLLECTION).insertOne(prod).then((data) => {

            callback(data.insertedId)
        })

    },

    getAllProducts: (callback) => {

        mongo.get().collection(dbCollection.PRODUCT_COLLECTION).find().toArray().then((products) => {
            callback(products)
        })
    },

    deleteProduct: (prodId) => {

        return new Promise((resolve, reject) => {
            mongo.get().collection(dbCollection.PRODUCT_COLLECTION).deleteOne({ _id: objectID(prodId) }).then(() => {
                const path = './public/product-images/' + prodId + '.jpg'
                try {
                    fs.unlinkSync(path)
                    console.log("Deleted")
                } catch (err) {
                    console.error(err)
                }
                resolve()
            })
        }).catch((err) => {
            reject(err)
        })
    },

    getProductDetails: (prodId) => {

        return new Promise((resolve, reject) => {

            mongo.get().collection(dbCollection.PRODUCT_COLLECTION).findOne({ _id: objectID(prodId) }).then((productdetails) => {
                resolve(productdetails)
            })
        })
    },

    editProduct: (prodId, prodDetails) => {

        return new Promise((resolve, reject) => {

            mongo.get().collection(dbCollection.PRODUCT_COLLECTION).
                updateOne({ _id: objectID(prodId) },
                    {
                        $set: {
                            name: prodDetails.name,
                            price: prodDetails.price,
                            des: prodDetails.des
                        }
                    }
                ).then(() => {
                    resolve()
                })
        })
    }
}