const Promise = require('bluebird');
const bcrypt = require('bcrypt-nodejs');
const Doctor = require('../database/doctor/doctorModel');
const Patient = require('../database/patient/patientModel');
const Disease = require('../database/disease/diseaseModel');

module.exports.registerDoctor = (name, email, contact, password) => {
    return new Promise((resolve, reject) => {

        var newDoc = new Doctor({
            name: name,
            email: email,
            contact: contact,
            password: password
        });

        bcrypt.genSalt(10, (err, salt) => {
            if (err) {
                console.log(err);
                reject({success: false, message: "An error occurred"});
            } else {
                bcrypt.hash(password, salt, null, (err, hash) => {
                    if (err) {
                        console.log(err);
                        reject({success: false, message: "An error occurred"});
                    } else {
                        newDoc.password = hash;
                        newDoc.save((err) => {
                            if (err) {
                                console.log(err);
                                if (err.code == 11000)
                                    reject({success: false, message: "A doctor already exists with the same email"});
                                else
                                    reject({success: false, message: "An error occurred"});
                            } else {
                                resolve({success: true, message: "Doctor successfully registered"});
                            }
                        });
                    }
                });
            }
        });
    });
};

module.exports.loginDoctor = (email, password) => {
    return new Promise((resolve, reject) => {
        Doctor.findOne({email: email}).populate({
            path: 'patients',
            model: 'Patient',
            populate: {
                path: 'current_disease',
                model: 'Disease'
            }
        }).exec((err, outputDoc) => {
            if (err) {
                console.log(err);
                reject({success: false, message: "An error occurred"});
            } else {
                if (!outputDoc)
                    reject({success: false, message: "Doctor not found!"});
                else {
                    bcrypt.compare(password, outputDoc.password, (err, valid) => {
                        if (err) {
                            console.log(err);
                            reject({success: false, message: "An error occurred"});
                        } else {
                            if (!valid)
                                reject({success: false, message: "Wrong password entered"});
                            else
                                resolve({success: true, message: "Doctor logged in successfully", doctor: outputDoc});
                        }
                    });
                }
            }
        });
    });
};

module.exports.registerPatient = (name, address, geoaddress, email, contact, disease_name) => {
    return new Promise((resolve, reject) => {
        Patient.findOne({$or: [{email: email}, {contact: contact}]}).exec((err, outputPatient) => {
            if (err) {
                console.log(err);
                reject({success: false, message: "An error occurred"});
            } else {

                Disease.findOne({name: disease_name}).exec((err, outputDisease) => {
                    if (err) {
                        console.log(err);
                        reject({success: false, message: "An error occurred"});
                    } else {
                        if (!outputDisease) {
                            outputDisease.save((err, savedDisease) => {
                                if (err) {
                                    console.log(err);
                                    reject({success: false, message: "An error occurred"});
                                } else {
                                    if (!outputPatient) {
                                        var newPatient = new Patient({
                                            name: name,
                                            address: address,
                                            geoaddress: geoaddress,
                                            email: email,
                                            contact: contact,
                                            current_disease: savedDisease._id
                                        });
                                        newPatient.save((err) => {
                                            if (err) {
                                                console.log(err);
                                                reject({success: false, message: "An error occurred"});
                                            } else {
                                                resolve({success: true, message: "Patient registered successfully"});
                                            }
                                        });
                                    } else {
                                        outputPatient.name = name;
                                        outputPatient.address = address;
                                        outputPatient.geoaddress = geoaddress;
                                        outputPatient.email = email;
                                        outputPatient.contact = contact;
                                        outputPatient.current_disease = savedDisease._id;
                                        outputPatient.save((err) => {
                                            if (err) {
                                                console.log(err);
                                                reject({success: false, message: "An error occurred"});
                                            } else {
                                                resolve({success: true, message: "Patient updated successfully"});
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    }
                });
            }
        });
    });
};

module.exports.registerDisease = (name, description, )