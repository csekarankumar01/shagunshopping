import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Product, { CATEGORIES } from '../src/models/Product.js';

describe('Product Schema & Stock Invariants', () => {
  it('should reject negative stock values at schema level', () => {
    const product = new Product({
      name: 'Kumkumadi Ayurvedic Night Serum',
      brand: 'Kama Ayurveda',
      category: 'Skincare',
      mrp: 2995,
      price: 2599,
      stock: -5, // Invalid: negative stock
    });

    const error = product.validateSync();
    assert.ok(error, 'Should fail validation on negative stock');
    assert.ok(error.errors.stock, 'Expected stock validation error');
    assert.match(error.errors.stock.message, /Stock cannot be negative/);
  });

  it('should reject non-integer stock quantities', () => {
    const product = new Product({
      name: 'Aloe Vera Hydrating Gel',
      brand: 'Forest Essentials',
      category: 'Skincare',
      mrp: 850,
      price: 799,
      stock: 3.75, // Invalid: fractional stock
    });

    const error = product.validateSync();
    assert.ok(error, 'Should reject fractional stock quantity');
    assert.ok(error.errors.stock, 'Expected validation error on stock');
    assert.match(error.errors.stock.message, /Stock must be an integer/);
  });

  it('should reject selling price greater than MRP', () => {
    const product = new Product({
      name: 'SPF 50 Sunscreen Matte Gel',
      brand: 'Re\'equil',
      category: 'Skincare',
      mrp: 699,
      price: 799, // Invalid: selling price > MRP
      stock: 20,
    });

    const error = product.validateSync();
    assert.ok(error, 'Should reject price higher than MRP');
    assert.ok(error.errors.price, 'Expected price validation error');
    assert.match(error.errors.price.message, /Selling price cannot be higher than MRP/);
  });

  it('should enforce permitted category taxonomy', () => {
    const product = new Product({
      name: 'Invalid Item',
      brand: 'Unknown',
      category: 'Automotive', // Invalid category
      mrp: 500,
      price: 400,
      stock: 10,
    });

    const error = product.validateSync();
    assert.ok(error, 'Should reject unknown product category');
    assert.ok(error.errors.category, 'Expected category error');
  });
});
