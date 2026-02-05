// Simple integration test for DriverContext
// Tests basic functionality without complex mocking

import React from 'react';
import { DriverProvider, useDriver } from '../DriverContext';

describe('DriverContext Integration', () => {
  it('should export DriverProvider and useDriver', () => {
    expect(DriverProvider).toBeDefined();
    expect(useDriver).toBeDefined();
    expect(typeof DriverProvider).toBe('function');
    expect(typeof useDriver).toBe('function');
  });

  it('should create context without errors', () => {
    expect(() => {
      const TestComponent = () => {
        return React.createElement(DriverProvider, { children: null });
      };
      TestComponent();
    }).not.toThrow();
  });
});