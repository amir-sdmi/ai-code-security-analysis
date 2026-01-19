import isEmpty from '../src/util_library/isEmpty';

const expect = require('chai').expect;

// Test suite for isEmpty.js: 
// (note: the test suite was generated using chatGPT 3.5)

describe('isEmpty.js : ', () => {
    it('should return true for null', () => {
      expect(isEmpty(null)).to.be.true;
    });
  
    it('should return true for true', () => {
      expect(isEmpty(true)).to.be.true;
    });
  
    it('should return false for a non-empty array', () => {
      expect(isEmpty([1, 2, 3])).to.be.false;
    });
  
    it('should return true for an empty array', () => {
      expect(isEmpty([])).to.be.true;
    });
   
    it('should return false for a non-empty string', () => {
      expect(isEmpty('abc')).to.be.false;
    });
  
    it('should return true for an empty string', () => {
      expect(isEmpty('')).to.be.true;
    });
  
    it('should return false for a non-empty object', () => {
      expect(isEmpty({ 'a': 1 })).to.be.false;
    });
  
    it('should return true for an empty object', () => {
      expect(isEmpty({})).to.be.true;
    });
  
    it('should return false for a non-empty map', () => {
      const nonEmptyMap = new Map([['key', 'value']]);
      expect(isEmpty(nonEmptyMap)).to.be.false;
    });
  
    it('should return true for an empty map', () => {
      const emptyMap = new Map();
      expect(isEmpty(emptyMap)).to.be.true;
    });
  
    it('should return false for a non-empty set', () => {
      const nonEmptySet = new Set([1, 2, 3]);
      expect(isEmpty(nonEmptySet)).to.be.false;
    });
  
    it('should return true for an empty set', () => {
      const emptySet = new Set();
      expect(isEmpty(emptySet)).to.be.true;
    });

    it('should return true for an empty object with prototype properties', () => {
        function MyObject() {}
        MyObject.prototype.someProperty = 'someValue';

        const emptyObjectWithPrototype = new MyObject();
        expect(isEmpty(emptyObjectWithPrototype)).to.be.true;
    });

  it('should return false for an object with own properties and prototype properties', () => {
    function MyObject() {}
    MyObject.prototype.someProperty = 'someValue';

    const objectWithProperties = new MyObject();
    objectWithProperties.ownProperty = 'ownValue';

    expect(isEmpty(objectWithProperties)).to.be.false;
  });
  });
  
  
  
  
  