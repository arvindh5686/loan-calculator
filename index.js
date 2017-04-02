'use strict'

const Promise = require('bluebird');
const fs = Promise.promisifyAll(require("fs"));
const request = Promise.promisify(require('request'));

let promises = [];
promises.push(fs.readFileAsync('./large/banks.csv', 'utf8'));
promises.push(fs.readFileAsync('./large/facilities.csv', 'utf8'));
promises.push(fs.readFileAsync('./large/covenants.csv', 'utf8'));
promises.push(fs.readFileAsync('./large/loans.csv', 'utf8'));
let bankFacilitiesMap = {};

function init() {
  Promise.all(promises)
            .then((result) => {
              let banks = result[0];
              let facilities = result[1];
              let covenants = result[2];
              let loans = result[3];
              bankFacilitiesMap = getBankInfo(banks, bankFacilitiesMap);
              bankFacilitiesMap = getFacilitiesInfo(facilities, bankFacilitiesMap);
              bankFacilitiesMap = getCovenantsInfo(covenants, bankFacilitiesMap);

              let loanMap = assignLoanAndCalculateYield(loans, bankFacilitiesMap);
              writeLoanInfoToFile(loanMap, bankFacilitiesMap);
            });
}

//assign loan to facilities and calculate yield
function assignLoanAndCalculateYield(loans, bankFacilitiesMap) {
  loans = loans.split("\n");
  loans.shift();
  loans.pop();

  let loanMap = {};
  loans.forEach(elem => {
    let loansInfo = elem.split(",");
    let id = Number(loansInfo[2]);
    let rate = Number(loansInfo[0]);
    let loanAmount = Number(loansInfo[1]);
    let defaultLikelihood = loansInfo[3];
    let bannedState = loansInfo[4];

    let keys = Object.keys(bankFacilitiesMap);
    let maxGain = 0;
    let maxGainFacility;
    for (let j = 0; j < keys.length; j++) {
      let bankId = keys[j];
      let facilities = bankFacilitiesMap[bankId].facilities;
      for (let k = 0; k < facilities.length; k++) {
        let maxDefaultLikelihood = facilities[k].maxDefaultLikelihood || bankId.maxDefaultLikelihood;
        let ruleBannedState = facilities[k].bannedState || bankId.bannedState;

        if (loanAmount > facilities[k].amount || bannedState == ruleBannedState
                                        || defaultLikelihood > maxDefaultLikelihood) continue;

        let netGain = loanAmount * rate - loanAmount * facilities[k].rate;
        if (netGain >= maxGain) {
          maxGain = netGain;
          maxGainFacility = facilities[k];
        }
      }
    }

    if (maxGainFacility) {
      maxGainFacility.amount -= loanAmount;
      loanMap[id] = maxGainFacility.id;
      let yieldAmt = (1 - defaultLikelihood) * rate * loanAmount - defaultLikelihood * loanAmount - maxGainFacility.rate * loanAmount;

      if (! maxGainFacility.yield) {
        maxGainFacility.yield = 0;
      }

      maxGainFacility.yield += yieldAmt;
    }
  });

  return loanMap;
}

//parse bank info from file
function getBankInfo(banks, bankFacilitiesMap) {
  banks = banks.split("\n");
  //remove first and last lines
  banks.shift();
  banks.pop();
  banks.forEach(elem => {
    let bankInfo = elem.split(",");
    let id = bankInfo[0];
    let bankName = bankInfo[1];
    bankFacilitiesMap[id] = {"name" : bankName};
  })

  return bankFacilitiesMap;
}

//parse facilities info from file
function getFacilitiesInfo(facilities, bankFacilitiesMap) {
  facilities = facilities.split("\n");
  facilities.shift();
  facilities.pop();

  facilities.forEach(elem => {
    let facilitiesInfo = elem.split(",");
    let amount = facilitiesInfo[0];
    let rate = facilitiesInfo[1];
    let id = facilitiesInfo[2];
    let bankId = Number(facilitiesInfo[3]);

    let facility = {
      "id" : id,
      "rate": rate,
      "amount": amount
    }

    if (! bankFacilitiesMap[bankId].facilities) {
        bankFacilitiesMap[bankId].facilities = [];
    }

    bankFacilitiesMap[bankId].facilities.push(facility);
  });

  return bankFacilitiesMap;
}

//parse covenants info from file
function getCovenantsInfo(covenants, bankFacilitiesMap) {
  covenants = covenants.split("\n");
  covenants.shift();
  covenants.pop();

  covenants.forEach(elem => {
    let covenantsInfo = elem.split(",");
    let bankId = Number(covenantsInfo[2]);
    let facilityId = Number(covenantsInfo[0]);
    let maxDefaultLikelihood = covenantsInfo[1];
    let bannedState = covenantsInfo[3];

    if (facilityId) {
      let facilities = bankFacilitiesMap[bankId].facilities;
      let j = 0;
      for (; j < facilities.length; j++) {
        if (facilities[j].id == facilityId) break;
      }

      facilities[j].maxDefaultLikelihood = maxDefaultLikelihood;
      facilities[j].bannedState = bannedState;
    } else {
      bankFacilitiesMap[bankId].maxDefaultLikelihood = maxDefaultLikelihood;
      bankFacilitiesMap[bankId].bannedState = bannedState;
    }
  });

  return bankFacilitiesMap;
}

//write final response to file
function writeLoanInfoToFile(loanMap, bankFacilitiesMap) {
  let writeStream = fs.createWriteStream('./large/assignment.csv');
  writeStream.write("loan_id, facility_id");
  writeStream.write("\n");
  // console.log(loanMap);
  for (let key in loanMap) {
    writeStream.write(key + "," + loanMap[key]);
    writeStream.write("\n");
  }

  writeStream.end();
  writeStream = fs.createWriteStream('./large/yields.csv');
  writeStream.write("facility_id, expected_yield");
  writeStream.write("\n");
  //console.log(facilities);
  for (let i in bankFacilitiesMap) {
    let facilities = bankFacilitiesMap[i].facilities;

    facilities.forEach(elem => {
      let yieldAmt = elem.yield ? Math.floor(elem.yield) : 0;
      writeStream.write(elem.id + "," + yieldAmt);
      writeStream.write("\n");
    })
  }
  writeStream.end();
}

function modifyBankFacilitiesMap(req, res) {
    //TODO: logic to add new facilities - bankFacilitiesMap
    res.send("new facility added");
}

function assignLoan(req, res) {
    //TODO: call assignLoanAndCalculateYield
    //assignLoanAndCalculateYield();
    res.send("loan assigned");
}

// function getFacilitiesInfo(req, res) {
//   //TODO: implementation here
//   res.send("test");
// }

init();

module.exports = {
  "addNewFacility" : modifyBankFacilitiesMap,
  "assignLoan": assignLoan,
  // "getFacilitiesInfo": getFacilitiesInfo
}
