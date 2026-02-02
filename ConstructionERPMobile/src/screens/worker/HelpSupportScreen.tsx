import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import ConstructionCard from '../../components/common/ConstructionCard';
import ConstructionButton from '../../components/common/ConstructionButton';
import { ConstructionTheme } from '../../utils/theme/constructionTheme';

interface HelpSupportScreenProps {
  navigation: any;
}

const HelpSupportScreen: React.FC<HelpSupportScreenProps> = ({ navigation }) => {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqData = [
    {
      id: 1,
      question: 'How do I clock in for attendance?',
      answer: 'Go to the Attendance tab and ensure you are within the construction site geofence. The app will automatically validate your location and enable the clock-in button.',
    },
    {
      id: 2,
      question: 'Why can\'t I start a task?',
      answer: 'Tasks must be completed in sequence. Check if prerequisite tasks are completed and ensure you are at the correct location for the task.',
    },
    {
      id: 3,
      question: 'How do I submit a daily report?',
      answer: 'Go to the Report tab, fill in your work description, add photos if needed, and submit. Make sure you are connected to the internet.',
    },
    {
      id: 4,
      question: 'What if I have GPS accuracy issues?',
      answer: 'Move to an open area away from buildings, wait for better signal, or restart your location services. Contact your supervisor if issues persist.',
    },
    {
      id: 5,
      question: 'How do I request leave or materials?',
      answer: 'Use the Requests tab to submit various requests. Fill in the required details and wait for supervisor approval.',
    },
  ];

  const troubleshootingSteps = [
    {
      title: 'GPS/Location Issues',
      steps: [
        'Check if location services are enabled',
        'Move to an open area with clear sky view',
        'Restart the app and try again',
        'Contact supervisor if problem persists',
      ],
    },
    {
      title: 'App Not Loading Data',
      steps: [
        'Check internet connection',
        'Pull down to refresh the screen',
        'Close and reopen the app',
        'Contact IT support if issue continues',
      ],
    },
    {
      title: 'Cannot Submit Forms',
      steps: [
        'Ensure all required fields are filled',
        'Check internet connectivity',
        'Try submitting again after a few minutes',
        'Save as draft and contact supervisor',
      ],
    },
  ];

  const handleContactSupervisor = () => {
    Alert.alert(
      'Contact Supervisor',
      'Choose how to contact your supervisor:',
      [
        {
          text: 'Call',
          onPress: () => {
            // In a real app, this would get the supervisor's phone from context/API
            const supervisorPhone = '+1234567890';
            Linking.openURL(`tel:${supervisorPhone}`);
          },
        },
        {
          text: 'Message',
          onPress: () => {
            navigation.navigate('IssueReport', { type: 'supervisor_contact' });
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleEmergencyContact = () => {
    Alert.alert(
      'Emergency Contact',
      'This will call emergency services. Only use for actual emergencies.',
      [
        {
          text: 'Call Emergency',
          style: 'destructive',
          onPress: () => {
            Linking.openURL('tel:911');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const toggleFAQ = (id: number) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Quick Actions */}
        <ConstructionCard style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <ConstructionButton
              title="Contact Supervisor"
              onPress={handleContactSupervisor}
              style={styles.actionButton}
              variant="secondary"
            />
            <ConstructionButton
              title="Report Issue"
              onPress={() => navigation.navigate('IssueReport')}
              style={styles.actionButton}
              variant="secondary"
            />
            <ConstructionButton
              title="Safety Incident"
              onPress={() => navigation.navigate('SafetyIncident')}
              style={styles.actionButton}
              variant="warning"
            />
            <ConstructionButton
              title="Emergency"
              onPress={handleEmergencyContact}
              style={styles.actionButton}
              variant="danger"
            />
          </View>
        </ConstructionCard>

        {/* FAQ Section */}
        <ConstructionCard style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {faqData.map((faq) => (
            <View key={faq.id} style={styles.faqItem}>
              <TouchableOpacity
                style={styles.faqQuestion}
                onPress={() => toggleFAQ(faq.id)}
              >
                <Text style={styles.faqQuestionText}>{faq.question}</Text>
                <Text style={styles.faqToggle}>
                  {expandedFAQ === faq.id ? '−' : '+'}
                </Text>
              </TouchableOpacity>
              {expandedFAQ === faq.id && (
                <View style={styles.faqAnswer}>
                  <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                </View>
              )}
            </View>
          ))}
        </ConstructionCard>

        {/* Troubleshooting Guide */}
        <ConstructionCard style={styles.section}>
          <Text style={styles.sectionTitle}>Troubleshooting Guide</Text>
          {troubleshootingSteps.map((guide, index) => (
            <View key={index} style={styles.troubleshootingItem}>
              <Text style={styles.troubleshootingTitle}>{guide.title}</Text>
              {guide.steps.map((step, stepIndex) => (
                <Text key={stepIndex} style={styles.troubleshootingStep}>
                  {stepIndex + 1}. {step}
                </Text>
              ))}
            </View>
          ))}
        </ConstructionCard>

        {/* Contact Information */}
        <ConstructionCard style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactLabel}>IT Support:</Text>
            <Text style={styles.contactValue}>support@construction.com</Text>
            <Text style={styles.contactLabel}>Emergency Hotline:</Text>
            <Text style={styles.contactValue}>911</Text>
            <Text style={styles.contactLabel}>Site Safety Officer:</Text>
            <Text style={styles.contactValue}>+1-555-SAFETY</Text>
          </View>
        </ConstructionCard>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ConstructionTheme.colors.background,
  },
  content: {
    padding: ConstructionTheme.spacing.md,
  },
  section: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  sectionTitle: {
    fontSize: ConstructionTheme.typography.sizes.lg,
    fontWeight: ConstructionTheme.typography.weights.bold,
    color: ConstructionTheme.colors.text.primary,
    marginBottom: ConstructionTheme.spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    marginBottom: ConstructionTheme.spacing.sm,
  },
  faqItem: {
    marginBottom: ConstructionTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ConstructionTheme.colors.border,
    paddingBottom: ConstructionTheme.spacing.sm,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ConstructionTheme.spacing.sm,
  },
  faqQuestionText: {
    fontSize: ConstructionTheme.typography.sizes.md,
    fontWeight: ConstructionTheme.typography.weights.semibold,
    color: ConstructionTheme.colors.text.primary,
    flex: 1,
  },
  faqToggle: {
    fontSize: ConstructionTheme.typography.sizes.xl,
    color: ConstructionTheme.colors.primary,
    fontWeight: ConstructionTheme.typography.weights.bold,
    marginLeft: ConstructionTheme.spacing.sm,
  },
  faqAnswer: {
    paddingLeft: ConstructionTheme.spacing.sm,
    paddingBottom: ConstructionTheme.spacing.sm,
  },
  faqAnswerText: {
    fontSize: ConstructionTheme.typography.sizes.sm,
    color: ConstructionTheme.colors.text.secondary,
    lineHeight: 20,
  },
  troubleshootingItem: {
    marginBottom: ConstructionTheme.spacing.md,
  },
  troubleshootingTitle: {
    fontSize: ConstructionTheme.typography.sizes.md,
    fontWeight: ConstructionTheme.typography.weights.semibold,
    color: ConstructionTheme.colors.text.primary,
    marginBottom: ConstructionTheme.spacing.sm,
  },
  troubleshootingStep: {
    fontSize: ConstructionTheme.typography.sizes.sm,
    color: ConstructionTheme.colors.text.secondary,
    marginBottom: ConstructionTheme.spacing.xs,
    paddingLeft: ConstructionTheme.spacing.sm,
  },
  contactInfo: {
    gap: ConstructionTheme.spacing.sm,
  },
  contactLabel: {
    fontSize: ConstructionTheme.typography.sizes.sm,
    fontWeight: ConstructionTheme.typography.weights.semibold,
    color: ConstructionTheme.colors.text.primary,
  },
  contactValue: {
    fontSize: ConstructionTheme.typography.sizes.sm,
    color: ConstructionTheme.colors.text.secondary,
    marginBottom: ConstructionTheme.spacing.sm,
  },
});

export default HelpSupportScreen;