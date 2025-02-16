const db = require('../../config/database');
const ejs = require('ejs');
const pdf = require('html-pdf');
const path = require('path');

exports.cetakLaporan = (req, res) => {
    const { tahun, bulan, jenis, tipe } = req.query;
    let query, tableName, jenisField;

    switch (tipe) {
        case 'simpanan':
            tableName = 'simpanan';
            if (jenis === 'Semua') {
                query = `
                    SELECT
                        p.nip,
                        p.nama,
                        s.simpanan_wajib,
                        s.simpanan_pokok,
                        s.simpanan_sukarela,
                        (s.simpanan_wajib + s.simpanan_pokok + s.simpanan_sukarela) AS total_simpanan
                    FROM ${tableName} s
                    JOIN anggota a ON s.id_anggota = a.id
                    JOIN pegawai p ON a.nip_anggota = p.nip
                    WHERE YEAR(s.tanggal) = ?
                    AND MONTH(s.tanggal) = ?
                `;
            } else {
                jenisField = jenis;
                query = `
                    SELECT
                        p.nip,
                        p.nama,
                        ${tableName}.${jenisField} AS jumlah
                    FROM ${tableName}
                    JOIN anggota a ON ${tableName}.id_anggota = a.id
                    JOIN pegawai p ON a.nip_anggota = p.nip
                    WHERE YEAR(${tableName}.tanggal) = ?
                    AND MONTH(${tableName}.tanggal) = ?
                `;
            }
            break;

        case 'pinjaman':
            tableName = 'pinjaman';
            jenisField = 'kategori';
            query = `
                SELECT
                    p.nip,
                    p.nama,
                    ${tableName}.${jenisField} AS jenis,
                    ${tableName}.jangka_waktu,
                    ${tableName}.jumlah_pinjaman AS jumlah
                FROM ${tableName}
                JOIN anggota a ON ${tableName}.id_anggota = a.id
                JOIN pegawai p ON a.nip_anggota = p.nip
                WHERE YEAR(${tableName}.tanggal_perjanjian) = ?
                AND MONTH(${tableName}.tanggal_perjanjian) = ?
            `;
            break;

        case 'kredit':
            tableName = jenis;
            query = `
                SELECT
                    p.nip,
                    p.nama,
                    '${jenis}' AS jenis,
                    ${tableName}.jangka_waktu,
                    ${tableName}.total_angsuran AS jumlah
                FROM ${tableName}
                JOIN anggota a ON ${tableName}.id_anggota = a.id
                JOIN pegawai p ON a.nip_anggota = p.nip
                WHERE YEAR(${tableName}.tanggal_mulai) = ?
                AND MONTH(${tableName}.tanggal_mulai) = ?
            `;
            break;

        default:
            return res.status(400).json({ message: 'Tipe laporan tidak valid' });
    }

    db.query(query, [tahun, bulan], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err });
        }

        const bulanList = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const bulanNama = bulanList[bulan - 1];

        const data = {
            tahun: tahun, // Tahun laporan
            bulan: bulanNama, // Nama bulan laporan (dalam bahasa Indonesia)
            jenisSimpanan: tipe === 'simpanan' ? (jenis === 'Semua' ? 'Semua' : jenis.replace('simpanan_', '').toUpperCase()) : null,  // Hanya untuk simpanan
            jenis: (tipe === 'pinjaman') ? (jenis === 'Semua' ? 'SEMUA' : jenis.toUpperCase()) : 
                   (tipe === 'kredit') ? jenis : jenis, // Format khusus untuk pinjaman dan kredit
            data: results, // Hasil query dari database
            tipe: tipe // Tipe laporan: 'simpanan', 'pinjaman', atau 'kredit'
        };
        

        const filePath = path.join(__dirname, '../../views/koperasi/pimpinan/templateLaporan.ejs');
        ejs.renderFile(filePath, data, (err, html) => {
            if (err) {
                return res.status(500).json({
                    message: 'Error rendering template',
                    error: err
                });
            }

            const options = {
                format: 'A4',
                border: {
                    top: '1cm',
                    right: '1cm',
                    bottom: '1cm',
                    left: '1cm'
                }
            };

            pdf.create(html, options).toStream((err, stream) => {
                if (err) {
                    return res.status(500).json({
                        message: 'Error generating PDF',
                        error: err
                    });
                }

                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename=laporan-${tipe}-${tahun}-${bulan}.pdf`);
                stream.pipe(res);
            });
        });
    });
};