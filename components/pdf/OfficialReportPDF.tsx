import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register a basic font (optional, react-pdf has default Helvetica)
// Font.register({ family: 'Inter', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf' });

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    width: '30%',
  },
  cardValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableColHeader: {
    width: '33.33%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: '#F1F5F9',
  },
  tableCol: {
    width: '33.33%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCellHeader: {
    margin: 5,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#334155',
  },
  tableCell: {
    margin: 5,
    fontSize: 10,
    color: '#475569',
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#EEF2FF',
    color: '#4F46E5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  }
});

interface ReportData {
  totalEvaluations: number;
  flaggedCount: number;
  sentiment: { positive: number; neutral: number; negative: number };
  topThemes: { name: string; count: number }[];
  departmentStats: { name: string; avgRating: number; evalCount: number }[];
  generatedAt: string;
}

export const OfficialReportPDF = ({ data }: { data: ReportData }) => {
  const totalSentiment = data.sentiment.positive + data.sentiment.neutral + data.sentiment.negative;
  const positivePct = totalSentiment > 0 ? Math.round((data.sentiment.positive / totalSentiment) * 100) : 0;
  const negativePct = totalSentiment > 0 ? Math.round((data.sentiment.negative / totalSentiment) * 100) : 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Uniqualis QA Official Report</Text>
          <Text style={styles.subtitle}>Generated on {data.generatedAt} • Automated System Export</Text>
        </View>

        {/* Executive Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <View style={styles.row}>
            <View style={styles.card}>
              <Text style={styles.cardValue}>{data.totalEvaluations}</Text>
              <Text style={styles.cardLabel}>Total Evaluations</Text>
            </View>
            <View style={styles.card}>
              <Text style={[styles.cardValue, { color: '#4F46E5' }]}>{positivePct}%</Text>
              <Text style={styles.cardLabel}>Positive Sentiment</Text>
            </View>
            <View style={styles.card}>
              <Text style={[styles.cardValue, { color: data.flaggedCount > 0 ? '#EF4444' : '#10B981' }]}>
                {data.flaggedCount}
              </Text>
              <Text style={styles.cardLabel}>Flagged Reports</Text>
            </View>
          </View>
        </View>

        {/* AI Theme Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dominant Themes (AI Analysis)</Text>
          <View style={styles.tagList}>
            {data.topThemes.map((theme, i) => (
              <Text key={i} style={styles.tag}>
                {theme.name} ({theme.count})
              </Text>
            ))}
            {data.topThemes.length === 0 && (
              <Text style={styles.tableCell}>No themes identified in the current period.</Text>
            )}
          </View>
        </View>

        {/* Department Performance Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Department Performance</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Department</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Avg Rating (out of 5)</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Total Evaluations</Text>
              </View>
            </View>
            
            {data.departmentStats.map((dept, i) => (
              <View style={styles.tableRow} key={i}>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{dept.name}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{dept.avgRating.toFixed(1)}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{dept.evalCount}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Uniqualis Quality Assurance Platform - Confidential & Internal Use Only</Text>
        </View>

      </Page>
    </Document>
  );
};
