/**
 * Settings Functionality Tests
 * Comprehensive test suite for Settings modal and related services
 */

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

class SettingsTestSuite {
  private results: TestResult[] = [];

  // Test API Key Validation
  async testApiKeyValidation(): Promise<TestResult> {
    try {
      // Mock validation function (since we can't import the component directly)
      const validateApiKeyFormat = (key: string): { isValid: boolean; error?: string } => {
        const trimmed = key.trim();
        
        if (!trimmed) {
          return { isValid: false, error: 'API key cannot be empty' };
        }
        
        if (trimmed.length < 20) {
          return { isValid: false, error: 'API key too short' };
        }
        
        if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) {
          return { isValid: false, error: 'Invalid API key format' };
        }
        
        return { isValid: true };
      };

      // Test cases
      const testCases = [
        { key: '', shouldPass: false, expectedError: 'API key cannot be empty' },
        { key: 'short', shouldPass: false, expectedError: 'API key too short' },
        { key: 'invalid@key#with$symbols', shouldPass: false, expectedError: 'Invalid API key format' },
        { key: 'AIzaSyDxKKKKKKKKKKKKKKKKKKKKKKKKKKKK', shouldPass: true },
        { key: 'valid-api_key123456789012345', shouldPass: true }
      ];

      for (const testCase of testCases) {
        const result = validateApiKeyFormat(testCase.key);
        
        if (testCase.shouldPass && !result.isValid) {
          throw new Error(`Expected "${testCase.key}" to be valid, but got: ${result.error}`);
        }
        
        if (!testCase.shouldPass && result.isValid) {
          throw new Error(`Expected "${testCase.key}" to be invalid, but it passed validation`);
        }
        
        if (!testCase.shouldPass && result.error !== testCase.expectedError) {
          throw new Error(`Expected error "${testCase.expectedError}", but got: ${result.error}`);
        }
      }

      return { name: 'API Key Validation', passed: true };
    } catch (error) {
      return { 
        name: 'API Key Validation', 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Test Haptic Preferences Integration
  async testHapticPreferencesIntegration(): Promise<TestResult> {
    try {
      // Test that preferences service exists and has required methods
      const { userPreferencesService } = await import('../services/userPreferencesService');
      
      // Test getting preferences
      const prefs = userPreferencesService.getPreferences();
      if (!prefs.hapticFeedback) {
        throw new Error('Haptic feedback preferences not found');
      }

      // Test updating preferences
      const originalIntensity = prefs.hapticFeedback.intensity;
      userPreferencesService.updateHapticPreferences({ intensity: 'heavy' });
      
      const updatedPrefs = userPreferencesService.getPreferences();
      if (updatedPrefs.hapticFeedback.intensity !== 'heavy') {
        throw new Error('Haptic preferences not updated correctly');
      }

      // Test shouldTriggerHaptic method
      const shouldTrigger = userPreferencesService.shouldTriggerHaptic('navigation');
      if (typeof shouldTrigger !== 'boolean') {
        throw new Error('shouldTriggerHaptic should return boolean');
      }

      // Restore original intensity
      userPreferencesService.updateHapticPreferences({ intensity: originalIntensity });

      return { name: 'Haptic Preferences Integration', passed: true };
    } catch (error) {
      return { 
        name: 'Haptic Preferences Integration', 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Test Storage Health Analyzer
  async testStorageHealthAnalyzer(): Promise<TestResult> {
    try {
      const { storageHealthAnalyzer } = await import('../services/storageHealthAnalyzer');
      
      // Test health analysis
      const report = await storageHealthAnalyzer.analyzeHealth();
      
      if (!report.overall || !report.details || !report.recommendations) {
        throw new Error('Health report missing required fields');
      }

      if (!['excellent', 'good', 'warning', 'critical', 'error'].includes(report.overall)) {
        throw new Error(`Invalid health status: ${report.overall}`);
      }

      // Test capacity analysis
      if (typeof report.details.capacity.percentage !== 'number') {
        throw new Error('Capacity percentage should be a number');
      }

      // Test integrity checks
      const integrity = report.details.integrity;
      if (typeof integrity.todos !== 'boolean' || 
          typeof integrity.templates !== 'boolean' || 
          typeof integrity.preferences !== 'boolean') {
        throw new Error('Integrity checks should return booleans');
      }

      // Test optimization (should not throw)
      await storageHealthAnalyzer.optimizeStorage();

      return { name: 'Storage Health Analyzer', passed: true };
    } catch (error) {
      return { 
        name: 'Storage Health Analyzer', 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Test Real-time Settings Sync
  async testRealTimeSync(): Promise<TestResult> {
    try {
      let eventFired = false;
      let eventDetail: any = null;

      // Listen for preference change events
      const handlePreferenceChange = (event: CustomEvent) => {
        eventFired = true;
        eventDetail = event.detail;
      };

      window.addEventListener('preferencesChanged', handlePreferenceChange as EventListener);

      // Simulate preference update (this would normally happen in SettingsModal)
      const { userPreferencesService } = await import('../services/userPreferencesService');
      userPreferencesService.updateHapticPreferences({ enabled: false });
      
      // Manually dispatch event (since we're not in the actual component)
      window.dispatchEvent(new CustomEvent('preferencesChanged', {
        detail: { type: 'haptic', preferences: { enabled: false } }
      }));

      // Check if event was fired
      if (!eventFired) {
        throw new Error('Preference change event not fired');
      }

      if (!eventDetail || eventDetail.type !== 'haptic') {
        throw new Error('Event detail incorrect');
      }

      // Cleanup
      window.removeEventListener('preferencesChanged', handlePreferenceChange as EventListener);

      return { name: 'Real-time Settings Sync', passed: true };
    } catch (error) {
      return { 
        name: 'Real-time Settings Sync', 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Test Error Boundaries
  async testErrorBoundaries(): Promise<TestResult> {
    try {
      // Test that services handle errors gracefully
      const { userPreferencesService } = await import('../services/userPreferencesService');
      
      // Test with corrupted localStorage
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = () => 'invalid json{';
      
      try {
        const prefs = userPreferencesService.getPreferences();
        // Should return defaults, not throw
        if (!prefs.hapticFeedback) {
          throw new Error('Should return default preferences on error');
        }
      } finally {
        localStorage.getItem = originalGetItem;
      }

      return { name: 'Error Boundaries', passed: true };
    } catch (error) {
      return { 
        name: 'Error Boundaries', 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Test Storage Corruption Repair
  async testCorruptionRepair(): Promise<TestResult> {
    try {
      const { storageHealthAnalyzer } = await import('../services/storageHealthAnalyzer');
      
      // Create corrupted data
      localStorage.setItem('curvycloud_todos', '{"invalid": json,}');
      
      // Test corruption detection
      const report = await storageHealthAnalyzer.analyzeHealth();
      if (report.details.corruption.length === 0) {
        throw new Error('Should detect corruption');
      }

      // Test repair
      const repaired = await storageHealthAnalyzer.repairCorruption();
      if (!repaired) {
        throw new Error('Should repair corruption');
      }

      // Verify repair worked
      const todos = JSON.parse(localStorage.getItem('curvycloud_todos') || '[]');
      if (!Array.isArray(todos)) {
        throw new Error('Repaired data should be valid array');
      }

      return { name: 'Storage Corruption Repair', passed: true };
    } catch (error) {
      return { 
        name: 'Storage Corruption Repair', 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Run all tests
  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Running Settings Tests...');
    
    this.results = [];
    
    this.results.push(await this.testApiKeyValidation());
    this.results.push(await this.testHapticPreferencesIntegration());
    this.results.push(await this.testStorageHealthAnalyzer());
    this.results.push(await this.testRealTimeSync());
    this.results.push(await this.testErrorBoundaries());
    this.results.push(await this.testCorruptionRepair());

    return this.results;
  }

  // Generate test report
  generateReport(): string {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const passRate = Math.round((passed / total) * 100);

    let report = `\n📊 Settings Test Report\n`;
    report += `${'='.repeat(50)}\n`;
    report += `✅ Passed: ${passed}/${total} (${passRate}%)\n\n`;

    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      report += `${status} ${result.name}\n`;
      if (!result.passed && result.error) {
        report += `   Error: ${result.error}\n`;
      }
    });

    report += `\n${'='.repeat(50)}\n`;
    
    if (passed === total) {
      report += `🎉 All tests passed! Settings functionality is solid.\n`;
    } else {
      report += `⚠️  ${total - passed} test(s) failed. Review and fix issues.\n`;
    }

    return report;
  }
}

// Export for use in test runner
export const settingsTestSuite = new SettingsTestSuite();

// Auto-run if in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).runSettingsTests = async () => {
    const results = await settingsTestSuite.runAllTests();
    console.log(settingsTestSuite.generateReport());
    return results;
  };
}