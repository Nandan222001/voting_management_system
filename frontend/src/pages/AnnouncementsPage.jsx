import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Calendar,
  Edit2,
  Eye,
  FileText,
  Image as ImageIcon,
  Megaphone,
  Plus,
  Search,
  Star,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import toast from 'react-hot-toast';
import MainLayout from '../components/layout/MainLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import Pagination from '../components/common/Pagination';
import announcementService from '../services/announcementService';
import { resolveMediaUrl } from '../utils/images';
import {
  deleteAnnouncement,
  fetchAnnouncements,
  publishAnnouncement,
  saveAnnouncement,
  selectAnnouncementActionLoading,
  selectAnnouncementLoading,
  selectAnnouncementTotal,
  selectAnnouncements,
  unpublishAnnouncement,
} from '../store/slices/announcementSlice';

const PER_PAGE = 10;
const emptyForm = {
  title: '',
  short_description: '',
  content: '',
  image_urls: [],
  attachment_urls: [],
  publish_date: new Date().toISOString().slice(0, 16),
  status: 'draft',
  is_featured: false,
};

function dateLabel(value) {
  if (!value) return 'Not scheduled';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function firstImage(item) {
  const url = item?.image_urls?.[0];
  return resolveMediaUrl(url);
}

export default function AnnouncementsPage() {
  const dispatch = useDispatch();
  const announcements = useSelector(selectAnnouncements);
  const total = useSelector(selectAnnouncementTotal);
  const loading = useSelector(selectAnnouncementLoading);
  const actionLoading = useSelector(selectAnnouncementActionLoading);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const totalPages = Math.ceil(total / PER_PAGE);
  const featuredCount = useMemo(() => announcements.filter((item) => item.is_featured).length, [announcements]);

  useEffect(() => {
    dispatch(fetchAnnouncements({ page, per_page: PER_PAGE, search: search || undefined, status: status || undefined }));
  }, [dispatch, page, search, status]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setForm({
      title: item.title || '',
      short_description: item.short_description || '',
      content: item.content || '',
      image_urls: item.image_urls || [],
      attachment_urls: item.attachment_urls || [],
      publish_date: item.publish_date ? new Date(item.publish_date).toISOString().slice(0, 16) : emptyForm.publish_date,
      status: item.status || 'draft',
      is_featured: Boolean(item.is_featured),
    });
    setFormOpen(true);
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function insertTag(tag) {
    const wrapped = `<${tag}>${form.content || ''}</${tag}>`;
    updateForm('content', wrapped);
  }

  async function handleUpload(files, type) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of Array.from(files)) {
        const response = type === 'image'
          ? await announcementService.uploadImage(file)
          : await announcementService.uploadAttachment(file);
        uploaded.push(response.data?.data?.url);
      }
      if (type === 'image') {
        updateForm('image_urls', [...form.image_urls, ...uploaded.filter(Boolean)]);
      } else {
        updateForm('attachment_urls', [...form.attachment_urls, ...uploaded.filter(Boolean)]);
      }
      toast.success('Upload completed');
    } catch (error) {
      toast.error(error.response?.data?.detail || error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    const payload = { ...form, publish_date: new Date(form.publish_date).toISOString() };
    try {
      await dispatch(saveAnnouncement({ id: editing?.id, data: payload })).unwrap();
      toast.success(editing ? 'Announcement updated' : 'Announcement created');
      setFormOpen(false);
      dispatch(fetchAnnouncements({ page, per_page: PER_PAGE, search: search || undefined, status: status || undefined }));
    } catch (error) {
      toast.error(error || 'Save failed');
    }
  }

  async function handleDelete() {
    try {
      await dispatch(deleteAnnouncement(deleteTarget.id)).unwrap();
      toast.success('Announcement deleted');
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error || 'Delete failed');
    }
  }

  async function togglePublish(item) {
    try {
      if (item.status === 'published') {
        await dispatch(unpublishAnnouncement(item.id)).unwrap();
        toast.success('Announcement unpublished');
      } else {
        await dispatch(publishAnnouncement(item.id)).unwrap();
        toast.success('Announcement published');
      }
    } catch (error) {
      toast.error(error || 'Status update failed');
    }
  }

  return (
    <MainLayout title="Announcements">
      <div className="space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1.5 w-8 rounded-full bg-[#1a337e]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1a337e]">Announcement Management</span>
            </div>
            <h2 className="text-4xl font-black tracking-tight text-gray-900">Announcements</h2>
            <p className="mt-2 text-sm font-semibold text-gray-500">{total} total records, {featuredCount} featured on this page</p>
          </div>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-[#1a337e] px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-900/20">
            <Plus className="h-4 w-4" /> New Announcement
          </button>
        </header>

        <section className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Search announcements..."
              className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-[#1a337e]"
            />
          </div>
          <div className="flex gap-2">
            {['', 'draft', 'published'].map((value) => (
              <button
                key={value || 'all'}
                onClick={() => { setStatus(value); setPage(1); }}
                className={`rounded-lg px-4 py-2 text-[11px] font-black uppercase tracking-wider ${status === value ? 'bg-[#1a337e] text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {value || 'All'}
              </button>
            ))}
          </div>
        </section>

        {loading && announcements.length === 0 ? (
          <div className="flex justify-center py-20"><LoadingSpinner /></div>
        ) : announcements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white py-20 text-center">
            <Megaphone className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm font-black uppercase tracking-widest text-gray-500">No announcements found</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {announcements.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex gap-4 p-4">
                  <div className="h-28 w-36 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                    {firstImage(item) ? <img src={firstImage(item)} alt={item.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><ImageIcon className="text-gray-300" /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${item.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{item.status}</span>
                      {item.is_featured && <span className="inline-flex items-center gap-1 rounded-full bg-[#dae2ff] px-2.5 py-1 text-[10px] font-black uppercase text-[#1a337e]"><Star className="h-3 w-3 fill-current" /> Featured</span>}
                    </div>
                    <h3 className="line-clamp-2 text-lg font-black leading-tight text-gray-900">{item.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm font-medium text-gray-500">{item.short_description}</p>
                    <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-gray-400">
                      <Calendar className="h-3.5 w-3.5" /> {dateLabel(item.publish_date)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-4 py-3">
                  <button onClick={() => setViewItem(item)} className="rounded-lg bg-white p-2 text-gray-500 hover:text-[#1a337e]" title="View"><Eye className="h-4 w-4" /></button>
                  <button onClick={() => openEdit(item)} className="rounded-lg bg-white p-2 text-gray-500 hover:text-[#1a337e]" title="Edit"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => togglePublish(item)} className="rounded-lg bg-white px-3 py-2 text-[10px] font-black uppercase text-[#1a337e]">
                    {item.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button onClick={() => setDeleteTarget(item)} className="rounded-lg bg-white p-2 text-red-500" title="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </article>
            ))}
          </div>
        )}

        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
      </div>

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit Announcement' : 'Create Announcement'} size="4xl">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-xs font-black uppercase tracking-wider text-gray-500">Title
              <input required value={form.title} onChange={(event) => updateForm('title', event.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm font-semibold text-gray-900 outline-none focus:border-[#1a337e]" />
            </label>
            <label className="space-y-1 text-xs font-black uppercase tracking-wider text-gray-500">Publish Date
              <input required type="datetime-local" value={form.publish_date} onChange={(event) => updateForm('publish_date', event.target.value)} className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm font-semibold text-gray-900 outline-none focus:border-[#1a337e]" />
            </label>
          </div>
          <label className="block space-y-1 text-xs font-black uppercase tracking-wider text-gray-500">Short Description
            <textarea required value={form.short_description} onChange={(event) => updateForm('short_description', event.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-gray-200 p-3 text-sm font-semibold text-gray-900 outline-none focus:border-[#1a337e]" />
          </label>
          <div>
            <div className="mb-2 flex items-center gap-2">
              {['h2', 'p', 'strong', 'em', 'ul'].map((tag) => (
                <button key={tag} type="button" onClick={() => insertTag(tag)} className="rounded-md border border-gray-200 px-3 py-1 text-[10px] font-black uppercase text-gray-500">{tag}</button>
              ))}
            </div>
            <textarea required value={form.content} onChange={(event) => updateForm('content', event.target.value)} rows={8} placeholder="Detailed rich content with HTML formatting..." className="w-full rounded-xl border border-gray-200 p-3 text-sm font-medium text-gray-900 outline-none focus:border-[#1a337e]" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-xs font-black uppercase tracking-wider text-gray-500">
              <UploadCloud className="h-4 w-4" /> Upload Images
              <input type="file" accept="image/png,image/jpeg" multiple className="hidden" onChange={(event) => handleUpload(event.target.files, 'image')} />
            </label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-xs font-black uppercase tracking-wider text-gray-500">
              <FileText className="h-4 w-4" /> Upload Attachments
              <input type="file" accept="image/png,image/jpeg,application/pdf" multiple className="hidden" onChange={(event) => handleUpload(event.target.files, 'attachment')} />
            </label>
          </div>
          {(form.image_urls.length > 0 || form.attachment_urls.length > 0) && (
            <div className="rounded-xl bg-gray-50 p-3 text-xs font-semibold text-gray-500">
              {form.image_urls.length} image(s), {form.attachment_urls.length} attachment(s) selected
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5">
            <label className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-600">
              <input type="checkbox" checked={form.is_featured} onChange={(event) => updateForm('is_featured', event.target.checked)} /> Featured
            </label>
            <select value={form.status} onChange={(event) => updateForm('status', event.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-black uppercase text-gray-600">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <button disabled={actionLoading || uploading} className="rounded-xl bg-[#1a337e] px-6 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-60">
              {actionLoading || uploading ? 'Saving...' : 'Save Announcement'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Announcement Details" size="3xl">
        {viewItem && (
          <div className="space-y-5">
            {firstImage(viewItem) && <img src={firstImage(viewItem)} alt={viewItem.title} className="max-h-80 w-full rounded-2xl object-cover" />}
            <div>
              <h3 className="text-2xl font-black text-gray-900">{viewItem.title}</h3>
              <p className="mt-2 text-sm font-semibold text-gray-500">{viewItem.short_description}</p>
            </div>
            <div className="prose max-w-none text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: viewItem.content }} />
            {viewItem.attachment_urls?.length > 0 && (
              <div className="space-y-2">
                {viewItem.attachment_urls.map((url) => (
                  <a
                    key={url}
                    href={resolveMediaUrl(url)}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg bg-gray-50 p-3 text-sm font-bold text-[#1a337e]"
                  >
                    {url.split('/').pop()}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Announcement" size="sm">
        <div className="space-y-5">
          <p className="text-sm font-semibold text-gray-600">Delete “{deleteTarget?.title}”? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-xs font-black uppercase text-gray-500">Cancel</button>
            <button onClick={handleDelete} className="rounded-lg bg-red-600 px-5 py-2 text-xs font-black uppercase text-white">Delete</button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
