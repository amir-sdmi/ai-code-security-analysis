import Transaction from "../src/Transaction.js";

describe("Transaction Tests: ", () => {
    let testTransaction, testAmount, testBalance, testDate, clgSpy, actual;

    beforeEach(() => {
        testDate = "12/12/2012";
        testAmount = 1000;
        testBalance = 1000;
        clgSpy = spyOn(console, 'log');
    })

    afterEach(() => {
        testTransaction = undefined;
        testAmount = undefined;
        testBalance = undefined;
        testDate = undefined;
    })

    // Strips colours to easier match outputs (found regex using chatGPT)
    function stripColours(text) {
        const colorRegex = /\x1B\[[0-9;]*[JKmsu]/g;
        return text.replace(colorRegex, '');
    }

    it("should return the amount of the transaction", () => {
        // Arrange
        testAmount = 50;
        testTransaction = new Transaction(testAmount);
        // Act
        // Assert
        expect(testTransaction.getAmount()).toBe(testAmount);
    });
    
    it("should return the total balance after the transaction", () => {
        // Arrange
        testBalance = 100;
        testTransaction = new Transaction(testAmount, testBalance);
        // Act
        // Assert
        expect(testTransaction.getBalance()).toBe(testBalance);
    });

    it("should return the date of the transaction", () => {
        // Arrange
        testDate = "12/12/2024";
        testTransaction = new Transaction(testAmount, testBalance, testDate);
        // Act
        // Assert
        expect(testTransaction.getDate()).toBe(testDate);
    });

    it("should call getDate when printTransaction is called", () => {
        // Arrange
        testTransaction = new Transaction(testAmount, testBalance, testDate);
        spyOn(testTransaction, 'getDate').and.callThrough();

        // Act
        testTransaction.printTransaction();
        // Assert
        expect(testTransaction.getDate).toHaveBeenCalled();
    });

    it("should call getBalance when printTransaction is called", () => {
        // Arrange
        testTransaction = new Transaction(testAmount, testBalance, testDate);
        spyOn(testTransaction, 'getBalance').and.callThrough();

        // Act
        testTransaction.printTransaction();
        // Assert
        expect(testTransaction.getBalance).toHaveBeenCalled();
    });

});
