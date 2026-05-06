import { Document, Page, Text, View, StyleSheet, Font, Image, Link } from '@react-pdf/renderer';

// Đăng ký font Tiếng Việt (Roboto - ổn định và phổ biến nhất)
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Roboto',
    backgroundColor: '#FFFFFF',
  },
  header: {
    marginBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1A202C',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 10,
    color: '#718096',
    marginTop: 4,
  },
  table: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 0,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#222222',
    color: '#FFFFFF',
    fontWeight: 700,
    fontSize: 9,
    padding: 10,
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
    paddingVertical: 10,
    alignItems: 'center',
    minHeight: 60,
  },
  colSection: { width: '18%', paddingRight: 8 },
  colNo: { width: '8%', textAlign: 'center' },
  colImage: { width: '15%', alignItems: 'center' },
  colProduct: { width: '44%', paddingHorizontal: 10 },
  colLink: { width: '15%', textAlign: 'center' },
  
  sectionText: { fontSize: 8, color: '#4A5568', fontWeight: 700, textTransform: 'uppercase' },
  noText: { fontSize: 9, color: '#718096' },
  productName: { fontSize: 10, fontWeight: 700, color: '#1A202C', marginBottom: 2 },
  productDesc: { fontSize: 8, color: '#718096', lineHeight: 1.4 },
  linkButton: {
    fontSize: 9,
    color: '#3182CE',
    textDecoration: 'none',
    fontWeight: 600,
  },
  image: {
    width: 45,
    height: 45,
    borderRadius: 4,
    objectFit: 'cover',
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#A0AEC0',
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
    paddingTop: 10,
  }
});

interface Product {
  no: number;
  section: string;
  name: string;
  desc: string;
  image?: string;
  link?: string;
}

export const ProductPDF = ({ products }: { products: Product[] }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>DANH SÁCH CÔNG BỐ SẢN PHẨM</Text>
          <Text style={styles.subtitle}>Desembre - Thẩm mỹ chuyên nghiệp từ Hàn Quốc</Text>
        </View>
        <Text style={{ fontSize: 9, color: '#A0AEC0' }}>2026 Edition</Text>
      </View>

      {/* Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.colSection}>SECTION</Text>
          <Text style={styles.colNo}>NO.</Text>
          <Text style={styles.colImage}>ẢNH</Text>
          <Text style={styles.colProduct}>SẢN PHẨM</Text>
          <Text style={styles.colLink}>CÔNG BỐ</Text>
        </View>

        {products.map((p) => (
          <View style={styles.tableRow} key={p.no} wrap={false}>
            <View style={styles.colSection}>
              <Text style={styles.sectionText}>{p.section}</Text>
            </View>
            <View style={styles.colNo}>
              <Text style={styles.noText}>{String(p.no).padStart(2, '0')}</Text>
            </View>
            <View style={styles.colImage}>
              {p.image ? (
                <Image src={p.image} style={styles.image} />
              ) : (
                <View style={[styles.image, { backgroundColor: '#F7FAFC' }]} />
              )}
            </View>
            <View style={styles.colProduct}>
              <Text style={styles.productName}>{p.name}</Text>
              <Text style={styles.productDesc}>{p.desc}</Text>
            </View>
            <View style={styles.colLink}>
              {p.link ? (
                <Link src={p.link} style={styles.linkButton}>
                  Mở Link
                </Link>
              ) : (
                <Text style={{ color: '#E2E8F0' }}>—</Text>
              )}
            </View>
          </View>
        ))}
      </View>


      {/* Footer */}
      <Text style={styles.footer} render={({ pageNumber, totalPages }) => (
        `Trang ${pageNumber} / ${totalPages} - Bản quyền © 2026 Desembre Vietnam`
      )} fixed />
    </Page>
  </Document>
);
