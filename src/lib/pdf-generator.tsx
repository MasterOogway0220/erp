import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Define styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 30,
        fontSize: 10,
        fontFamily: 'Helvetica',
    },
    header: {
        marginBottom: 20,
        borderBottom: 1,
        borderBottomColor: '#111',
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    companyInfo: {
        flexDirection: 'column',
    },
    companyName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    section: {
        margin: 10,
        padding: 10,
    },
    title: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 20,
        textTransform: 'uppercase',
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    infoBox: {
        width: '45%',
    },
    label: {
        fontWeight: 'bold',
        marginBottom: 2,
    },
    table: {
        display: 'flex',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#bfbfbf',
        marginBottom: 20,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#bfbfbf',
    },
    tableHeader: {
        backgroundColor: '#f3f4f6',
        fontWeight: 'bold',
    },
    tableCol: {
        width: '20%',
        padding: 5,
    },
    tableColLarge: {
        width: '40%',
        padding: 5,
    },
    tableColSmall: {
        width: '10%',
        padding: 5,
    },
    totalSection: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    totalBox: {
        width: '30%',
        borderTop: 1,
        borderTopColor: '#111',
        paddingTop: 5,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    totalLabel: {
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 30,
        right: 30,
        textAlign: 'center',
        color: 'grey',
        fontSize: 8,
        borderTop: 1,
        borderTopColor: '#EEE',
        paddingTop: 10,
    },
    isoBadge: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#1e40af',
        border: 1,
        borderColor: '#1e40af',
        padding: 4,
        textAlign: 'center',
    }
});

interface QuotationProps {
    data: any;
    showPrice: boolean;
    company: any;
}

export const QuotationPDF = ({ data, showPrice, company }: QuotationProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.companyInfo}>
                    <Text style={styles.companyName}>{company?.name || 'STEEL TRADING CO.'}</Text>
                    <Text>{company?.address || '123 Steel Yard, Mumbai, India'}</Text>
                    <Text>GSTIN: {company?.gstin || '27XXXXX0000X1Z1'}</Text>
                    <Text>Email: {company?.email || 'sales@steeltrading.com'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <View style={[styles.isoBadge, { marginBottom: 10 }]}>
                        <Text>ISO 9001:2015</Text>
                        <Text style={{ fontSize: 6 }}>CERTIFIED COMPANY</Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1e40af' }}>QUOTATION</Text>
                    <Text>No: {data.quotation_number}</Text>
                    <Text>Date: {new Date(data.created_at).toLocaleDateString()}</Text>
                    <Text>Rev: {data.version_number || 1}</Text>
                </View>
            </View>

            {/* Addresses */}
            <View style={styles.infoContainer}>
                <View style={styles.infoBox}>
                    <Text style={styles.label}>Quoted To:</Text>
                    <Text>{data.customer?.name}</Text>
                    <Text>{data.customer?.address}</Text>
                    <Text>Attn: {data.buyer?.name}</Text>
                </View>
                <View style={styles.infoBox}>
                    <Text style={styles.label}>Other Details:</Text>
                    <Text>Enquiry Ref: {data.enquiry?.enquiry_number || 'N/A'}</Text>
                    <Text>Payment Terms: {data.payment_terms || 'As per Master'}</Text>
                    <Text>Delivery: {data.delivery_terms || 'Ex-Works'}</Text>
                </View>
            </View>

            {/* Table */}
            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={styles.tableColSmall}>Sr.</Text>
                    <Text style={styles.tableColLarge}>Description of Goods</Text>
                    <Text style={styles.tableCol}>Qty</Text>
                    {showPrice && (
                        <>
                            <Text style={styles.tableCol}>Rate</Text>
                            <Text style={styles.tableCol}>Amount</Text>
                        </>
                    )}
                    {!showPrice && (
                        <Text style={[styles.tableCol, { width: '30%' }]}>Unit</Text>
                    )}
                </View>
                {data.items?.map((item: any, index: number) => (
                    <View style={styles.tableRow} key={item.id}>
                        <Text style={styles.tableColSmall}>{index + 1}</Text>
                        <Text style={styles.tableColLarge}>{item.product?.name || item.product_name || item.description}</Text>
                        <Text style={styles.tableCol}>{item.quantity} {item.uom?.code || item.uom || 'Nos'}</Text>
                        {showPrice && (
                            <>
                                <Text style={styles.tableCol}>₹{item.unit_price?.toLocaleString()}</Text>
                                <Text style={styles.tableCol}>₹{item.line_total?.toLocaleString() || item.total?.toLocaleString()}</Text>
                            </>
                        )}
                        {!showPrice && (
                            <Text style={[styles.tableCol, { width: '30%' }]}>{item.uom?.name || 'Nos'}</Text>
                        )}
                    </View>
                ))}
            </View>

            {/* Totals */}
            {showPrice && (
                <View style={styles.totalSection}>
                    <View style={styles.totalBox}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal:</Text>
                            <Text>₹{data.subtotal}</Text>
                        </View>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>GST (18%):</Text>
                            <Text>₹{data.tax_amount}</Text>
                        </View>
                        <View style={[styles.totalRow, { marginTop: 5, borderTop: 1 }]}>
                            <Text style={[styles.totalLabel, { fontSize: 12 }]}>Total:</Text>
                            <Text style={{ fontSize: 12, fontWeight: 'bold' }}>₹{data.total_amount}</Text>
                        </View>
                    </View>
                </View>
            )}

            {/* Terms */}
            <View style={{ marginTop: 20 }}>
                <Text style={styles.label}>Terms & Conditions:</Text>
                {(data.terms || []).map((term: any, idx: number) => (
                    <Text key={idx} style={{ marginBottom: 2 }}>{term.display_order}. {term.custom_text || term.description}</Text>
                ))}
            </View>

            <View style={styles.footer}>
                <Text>ISO 9001:2015 Certified Company | CIN: {company?.cin || 'UXXXXXXXXXXXXXX'} | Member of Steel Association</Text>
                <Text style={{ marginTop: 2 }}>This is a computer generated document and does not require a physical signature.</Text>
            </View>
        </Page>
    </Document>
);

export const PurchaseOrderPDF = ({ data, company }: { data: any; company: any }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <View style={styles.companyInfo}>
                    <Text style={styles.companyName}>{company?.name || 'STEEL TRADING CO.'}</Text>
                    <Text>{company?.address || '123 Steel Yard, Mumbai, India'}</Text>
                </View>
                <View>
                    <Text style={{ fontSize: 14, fontWeight: 'bold' }}>PURCHASE ORDER</Text>
                    <Text>No: {data.po_number}</Text>
                    <Text>Date: {new Date(data.created_at).toLocaleDateString()}</Text>
                </View>
            </View>

            <View style={styles.infoContainer}>
                <View style={styles.infoBox}>
                    <Text style={styles.label}>Vendor:</Text>
                    <Text>{data.vendor?.name}</Text>
                    <Text>{data.vendor?.address}</Text>
                </View>
                <View style={styles.infoBox}>
                    <Text style={styles.label}>Ship To:</Text>
                    <Text>{company?.warehouse_address || company?.address}</Text>
                    <Text>Expected Delivery: {new Date(data.delivery_date).toLocaleDateString()}</Text>
                </View>
            </View>

            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={styles.tableColSmall}>Sr.</Text>
                    <Text style={styles.tableColLarge}>Product / Description</Text>
                    <Text style={styles.tableCol}>Qty</Text>
                    <Text style={styles.tableCol}>Rate</Text>
                    <Text style={styles.tableCol}>Total</Text>
                </View>
                {data.items?.map((item: any, index: number) => (
                    <View style={styles.tableRow} key={item.id}>
                        <Text style={styles.tableColSmall}>{index + 1}</Text>
                        <Text style={styles.tableColLarge}>{item.product?.name || item.description}</Text>
                        <Text style={styles.tableCol}>{item.quantity} {item.uom || 'Nos'}</Text>
                        <Text style={styles.tableCol}>₹{item.unit_price}</Text>
                        <Text style={styles.tableCol}>₹{item.total}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.totalSection}>
                <View style={styles.totalBox}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Grand Total:</Text>
                        <Text style={{ fontSize: 12, fontWeight: 'bold' }}>₹{data.total}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <Text>Authorized Signature | ISO 9001:2018 Certified</Text>
            </View>
        </Page>
    </Document>
);

export const InvoicePDF = ({ data, company }: { data: any; company: any }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <View style={styles.companyInfo}>
                    <Text style={styles.companyName}>{company?.name || 'STEEL TRADING CO.'}</Text>
                    <Text>{company?.address || '123 Steel Yard, Mumbai, India'}</Text>
                    <Text>GSTIN: {company?.gstin}</Text>
                </View>
                <View>
                    <Text style={{ fontSize: 14, fontWeight: 'bold' }}>TAX INVOICE</Text>
                    <Text>No: {data.invoice_number}</Text>
                    <Text>Date: {new Date(data.created_at).toLocaleDateString()}</Text>
                </View>
            </View>

            <View style={styles.infoContainer}>
                <View style={styles.infoBox}>
                    <Text style={styles.label}>Bill To:</Text>
                    <Text>{data.customer?.name}</Text>
                    <Text>{data.customer?.address}</Text>
                    <Text>GSTIN: {data.customer?.gstin}</Text>
                </View>
                <View style={styles.infoBox}>
                    <Text style={styles.label}>Shipping Details:</Text>
                    <Text>Dispatch Ref: {data.dispatch?.dispatch_number}</Text>
                    <Text>Vehicle No: {data.dispatch?.vehicle_number}</Text>
                </View>
            </View>

            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={styles.tableColSmall}>Sr.</Text>
                    <Text style={styles.tableColLarge}>Description of Goods</Text>
                    <Text style={styles.tableCol}>Qty</Text>
                    <Text style={styles.tableCol}>Rate</Text>
                    <Text style={styles.tableCol}>Total</Text>
                </View>
                {data.items?.map((item: any, index: number) => (
                    <View style={styles.tableRow} key={item.id}>
                        <Text style={styles.tableColSmall}>{index + 1}</Text>
                        <Text style={styles.tableColLarge}>{item.product?.name || item.description}</Text>
                        <Text style={styles.tableCol}>{item.quantity} {item.uom || 'Nos'}</Text>
                        <Text style={styles.tableCol}>₹{item.unit_price}</Text>
                        <Text style={styles.tableCol}>₹{item.total}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.totalSection}>
                <View style={styles.totalBox}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Subtotal:</Text>
                        <Text>₹{data.subtotal}</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>GST:</Text>
                        <Text>₹{data.tax_amount}</Text>
                    </View>
                    <View style={[styles.totalRow, { marginTop: 5, borderTop: 1 }]}>
                        <Text style={[styles.totalLabel, { fontSize: 12 }]}>Total Amount:</Text>
                        <Text style={{ fontSize: 12, fontWeight: 'bold' }}>₹{data.total_amount}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <Text>Thank you for your business! | ISO 9001:2018 Certified</Text>
            </View>
        </Page>
    </Document>
);
