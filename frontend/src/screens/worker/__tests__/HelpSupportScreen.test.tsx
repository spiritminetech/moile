import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import HelpSupportScreen from '../HelpSupportScreen';

// Mock dependencies
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
  Linking: {
    openURL: jest.fn(),
  },
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

describe('HelpSupportScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders help and support screen correctly', () => {
    const { getByText } = render(
      <HelpSupportScreen navigation={mockNavigation} />
    );

    // Check main sections are present
    expect(getByText('Quick Actions')).toBeTruthy();
    expect(getByText('Frequently Asked Questions')).toBeTruthy();
    expect(getByText('Troubleshooting Guide')).toBeTruthy();
    expect(getByText('Contact Information')).toBeTruthy();
  });

  it('displays quick action buttons', () => {
    const { getByText } = render(
      <HelpSupportScreen navigation={mockNavigation} />
    );

    expect(getByText('Contact Supervisor')).toBeTruthy();
    expect(getByText('Report Issue')).toBeTruthy();
    expect(getByText('Safety Incident')).toBeTruthy();
    expect(getByText('Emergency')).toBeTruthy();
  });

  it('displays FAQ items', () => {
    const { getByText } = render(
      <HelpSupportScreen navigation={mockNavigation} />
    );

    expect(getByText('How do I clock in for attendance?')).toBeTruthy();
    expect(getByText('Why can\'t I start a task?')).toBeTruthy();
    expect(getByText('How do I submit a daily report?')).toBeTruthy();
  });

  it('expands and collapses FAQ items when tapped', () => {
    const { getByText, queryByText } = render(
      <HelpSupportScreen navigation={mockNavigation} />
    );

    const faqQuestion = getByText('How do I clock in for attendance?');
    
    // Initially, answer should not be visible
    expect(queryByText(/Go to the Attendance tab/)).toBeFalsy();
    
    // Tap to expand
    fireEvent.press(faqQuestion);
    
    // Answer should now be visible
    expect(getByText(/Go to the Attendance tab/)).toBeTruthy();
    
    // Tap again to collapse
    fireEvent.press(faqQuestion);
    
    // Answer should be hidden again
    expect(queryByText(/Go to the Attendance tab/)).toBeFalsy();
  });

  it('navigates to issue report screen when Report Issue is pressed', () => {
    const { getByText } = render(
      <HelpSupportScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByText('Report Issue'));
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('IssueReport');
  });

  it('navigates to safety incident screen when Safety Incident is pressed', () => {
    const { getByText } = render(
      <HelpSupportScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByText('Safety Incident'));
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('SafetyIncident');
  });

  it('shows contact supervisor alert when Contact Supervisor is pressed', () => {
    const { getByText } = render(
      <HelpSupportScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByText('Contact Supervisor'));
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Contact Supervisor',
      'Choose how to contact your supervisor:',
      expect.any(Array)
    );
  });

  it('shows emergency alert when Emergency is pressed', () => {
    const { getByText } = render(
      <HelpSupportScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByText('Emergency'));
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Emergency Contact',
      'This will call emergency services. Only use for actual emergencies.',
      expect.any(Array)
    );
  });

  it('displays troubleshooting guides', () => {
    const { getByText } = render(
      <HelpSupportScreen navigation={mockNavigation} />
    );

    expect(getByText('GPS/Location Issues')).toBeTruthy();
    expect(getByText('App Not Loading Data')).toBeTruthy();
    expect(getByText('Cannot Submit Forms')).toBeTruthy();
  });

  it('displays contact information', () => {
    const { getByText } = render(
      <HelpSupportScreen navigation={mockNavigation} />
    );

    expect(getByText('IT Support:')).toBeTruthy();
    expect(getByText('support@construction.com')).toBeTruthy();
    expect(getByText('Emergency Hotline:')).toBeTruthy();
    expect(getByText('911')).toBeTruthy();
  });
});