const db = require('../../config/database');

exports.getPinjamanPimpinan = (req, res) => {
    console.log("Session Data:", req.session);

    if (req.session.role !== 'Pimpinan') {
        console.log("Redirecting to /auth/login because role is:", req.session.role);
        return res.status(403).redirect('/auth/login');
    }

    console.log("User is Pimpinan, fetching data...");

    const queryTahun = `SELECT DISTINCT YEAR(tanggal_perjanjian) AS tahun FROM pinjaman ORDER BY tahun DESC`;

    const queryBulan = `SELECT DISTINCT MONTH(tanggal_perjanjian) AS bulan FROM pinjaman ORDER BY bulan ASC`;

    db.query(queryTahun, (err, tahunResults) => {
        if (err) {
            return res.status(500).json({ message: 'Database error (tahun)', error: err });
        }

        db.query(queryBulan, (err, bulanResults) => {
            if (err) {
                return res.status(500).json({ message: 'Database error (bulan)', error: err });
            }

            res.render('koperasi/pimpinan/pinjamanPimpinan', {
                title: 'Data Pinjaman',
                tahunList: tahunResults.map(t => t.tahun),
                bulanList: bulanResults.map(b => b.bulan),
                jenisPinjaman: ['jangka panjang', 'jangka pendek'],
                data: [],
                jenis: null // Add this line to provide a default value
            });
        });
    });
};

exports.filterData = async (req, res) => {
    const { tahun, bulan, jenis, page = 1, limit = 10 } = req.body;

    if (!tahun || !bulan) {
        return res.status(400).json({ message: 'Harap lengkapi semua filter!' });
    }

    try {
        const offset = (page - 1) * limit;

        const executeQuery = (query, params) => {
            return new Promise((resolve, reject) => {
                db.query(query, params, (err, results) => {
                    if (err) reject(err);
                    resolve(results);
                });
            });
        };

        let query, countQuery;

        if (jenis === 'Semua') {
            query = `
                SELECT
                    p.nip,
                    p.nama,
                    pj.kategori,
                    pj.jumlah_pinjaman,
                    pj.jangka_waktu,
                    pj.margin_persen,
                    pj.angsuran_pokok,
                    pj.margin_per_bulan,
                    pj.total_angsuran,
                    pj.angsuran_ke,
                    pj.sisa_piutang,
                    pj.tanggal_perjanjian,
                    pj.ket_status
                FROM pinjaman pj
                JOIN anggota a ON pj.id_anggota = a.id
                JOIN pegawai p ON a.nip_anggota = p.nip
                WHERE YEAR(pj.tanggal_perjanjian) = ?
                AND MONTH(pj.tanggal_perjanjian) = ?
                LIMIT ? OFFSET ?
            `;

            countQuery = `
                SELECT COUNT(*) AS total
                FROM pinjaman pj
                JOIN anggota a ON pj.id_anggota = a.id
                JOIN pegawai p ON a.nip_anggota = p.nip
                WHERE YEAR(pj.tanggal_perjanjian) = ?
                AND MONTH(pj.tanggal_perjanjian) = ?
            `;
        } else {
            query = `
                SELECT
                    p.nip,
                    p.nama,
                    pj.kategori AS jenis,
                    pj.jangka_waktu,
                    pj.jumlah_pinjaman AS jumlah
                FROM pinjaman pj
                JOIN anggota a ON pj.id_anggota = a.id
                JOIN pegawai p ON a.nip_anggota = p.nip
                WHERE YEAR(pj.tanggal_perjanjian) = ?
                AND MONTH(pj.tanggal_perjanjian) = ?
                AND pj.kategori = ?
                LIMIT ? OFFSET ?
            `;

            countQuery = `
                SELECT COUNT(*) AS total
                FROM pinjaman pj
                JOIN anggota a ON pj.id_anggota = a.id
                JOIN pegawai p ON a.nip_anggota = p.nip
                WHERE YEAR(pj.tanggal_perjanjian) = ?
                AND MONTH(pj.tanggal_perjanjian) = ?
                AND pj.kategori = ?
            `;
        }

        const [data, totalResults] = await Promise.all([
            executeQuery(query, jenis === 'Semua' ? [tahun, bulan, parseInt(limit), offset] : [tahun, bulan, jenis, parseInt(limit), offset]),
            executeQuery(countQuery, jenis === 'Semua' ? [tahun, bulan] : [tahun, bulan, jenis])
        ]);

        const total = totalResults[0].total;

        res.json({
            data,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({
            message: 'Terjadi kesalahan saat memuat data.',
            error: error.message
        });
    }
};