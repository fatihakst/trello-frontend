import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import API from '../api';

export default function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Sayfa açıldığında projeleri çek
    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await API.get('/Projects');
            setProjects(res.data);
        } catch (err) {
            console.error('Projeler çekilemedi:', err);
        }
    };

    // Yeni proje ekleme
    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            await API.post('/Projects', { title, description });
            setTitle('');
            setDescription('');
            fetchProjects(); // Ekledikten sonra listeyi güncelle
        } catch (err) {
            setError('Proje eklenirken bir hata oluştu!');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>Projelerim</h1>
                <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer' }}>
                    Çıkış Yap
                </button>
            </div>

            {/* Proje Ekleme Formu */}
            <form onSubmit={handleCreateProject} style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
                <h3>Yeni Proje Oluştur</h3>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <div style={{ marginBottom: '10px' }}>
                    <input
                        type="text"
                        placeholder="Proje Başlığı"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <input
                        type="text"
                        placeholder="Açıklama"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                    />
                </div>
                <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>
                    Ekle
                </button>
            </form>

            {/* Projeler Listesi */}
            <div>
                <h3>Mevcut Projeler</h3>
                {projects.length === 0 ? (
                    <p>Henüz hiç projen yok. Yukarıdan bir tane oluşturabilirsin!</p>
                ) : (
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => navigate(`/projects/${project.id}`)}
                                style={{ padding: '15px', border: '1px solid #ddd', borderRadius: '6px', backgroundColor: '#f9f9f9', cursor: 'pointer' }}
                            >
                                <h4 style={{ margin: '0 0 8px 0' }}>{project.title}</h4>
                                <p style={{ margin: 0, color: '#666' }}>{project.description}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}