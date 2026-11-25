import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import Login from './components/Login'
import Signup from './components/Signup'
import {
  createItem,
  deleteItem,
  getAuthToken,
  getItems,
  getOwnedItemDetails,
  TOKEN_KEY,
  updateItem,
} from './services/itemService'
import { getProfile } from './services/authService'
import { USER_KEY } from './services/authConfig'

const categories = ['Electronics', 'Bags', 'Documents', 'Accessories', 'Clothing', 'Other']

const emptyForm = {
  title: '',
  description: '',
  category: 'Electronics',
  location: '',
  date: '',
  contactName: '',
  contactEmail: '',
}

function ItemGrid({ items, loading, error, onRetry, onSelectItem, getEmoji }) {
  if (loading) {
    return <div className="empty-state" role="status"><h3>Loading reports...</h3></div>
  }

  if (error) {
    return (
      <div className="empty-state" role="alert">
        <h3>Reports could not be loaded</h3>
        <p>{error}</p>
        <button className="btn btn-outline" type="button" onClick={onRetry}>Try Again</button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <span>📭</span>
        <h3>No reports found</h3>
        <p>Try changing your search or filters, or create a report.</p>
      </div>
    )
  }

  return (
    <div className="items-grid">
      {items.map((item) => (
        <article className="item-card" key={item._id}>
          <div className="item-image">
            <span>{getEmoji(item.category)}</span>
            <span className={`status-label ${item.status.toLowerCase()}`}>{item.status}</span>
          </div>
          <div className="item-details">
            <h3>{item.title}</h3>
            <p>{item.location}</p>
            <p>{item.category}</p>
            <button
              className="btn btn-outline full-width"
              type="button"
              onClick={() => onSelectItem(item)}
            >
              View Details
            </button>
          </div>
        </article>
      ))}
    </div>
  )
}

function App() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [itemsError, setItemsError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [selectedItem, setSelectedItem] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [error, setError] = useState('')
  const [detailError, setDetailError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [openingEdit, setOpeningEdit] = useState(false)
  const [notification, setNotification] = useState(null)
  const [status, setStatus] = useState('Lost')
  const [authMode, setAuthMode] = useState('login')
  const [authLoading, setAuthLoading] = useState(() => Boolean(getAuthToken()))

  const [user, setUser] = useState(() => {
    try {
      if (!getAuthToken()) return null
      return JSON.parse(localStorage.getItem(USER_KEY)) || null
    } catch {
      return null
    }
  })

  const loadItems = async () => {
    setLoading(true)
    setItemsError('')
    try {
      setItems(await getItems())
    } catch (loadError) {
      setItemsError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false

    const fetchInitialItems = async () => {
      try {
        const initialItems = await getItems()
        if (!ignore) {
          setItems(initialItems)
          setItemsError('')
        }
      } catch (loadError) {
        if (!ignore) setItemsError(loadError.message)
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    fetchInitialItems()
    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    const clearSession = () => {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      setUser(null)
      setAuthLoading(false)
    }

    window.addEventListener('findit:unauthorized', clearSession)

    const validateSession = async () => {
      const token = getAuthToken()
      if (!token) {
        setAuthLoading(false)
        return
      }

      try {
        const result = await getProfile()
        if (result.user) {
          localStorage.setItem(USER_KEY, JSON.stringify(result.user))
          setUser(result.user)
        } else {
          clearSession()
        }
      } catch {
        // Keep the cached session if the API is temporarily unavailable.
      } finally {
        setAuthLoading(false)
      }
    }

    validateSession()
    return () => window.removeEventListener('findit:unauthorized', clearSession)
  }, [])

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()

    return items.filter((item) => {
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter
      const matchesSearch =
        !query ||
        [item.title, item.description, item.location, item.category]
          .some((value) => value?.toLowerCase().includes(query))

      return matchesStatus && matchesCategory && matchesSearch
    })
  }, [items, search, statusFilter, categoryFilter])

  const openForm = (itemStatus = 'Lost') => {
    setStatus(itemStatus)
    setEditingId(null)
    setFormData({
      ...emptyForm,
      contactName: user?.name || '',
      contactEmail: user?.email || '',
    })
    setError('')
    setShowForm(true)
  }

  const closeForm = () => {
    if (!submitting) {
      setShowForm(false)
      setEditingId(null)
      setFormData(emptyForm)
      setError('')
    }
  }

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const editItem = async (item) => {
    if (!isOwner(item)) return

    setOpeningEdit(true)
    setDetailError('')
    try {
      const ownedItem = await getOwnedItemDetails(item._id)
      setSelectedItem(null)
      setStatus(ownedItem.status)
      setEditingId(ownedItem._id)
      setFormData({
        title: ownedItem.title || '',
        description: ownedItem.description || '',
        category: ownedItem.category || 'Electronics',
        location: ownedItem.location || '',
        date: ownedItem.date ? new Date(ownedItem.date).toISOString().split('T')[0] : '',
        contactName: ownedItem.contactName || '',
        contactEmail: ownedItem.contactEmail || user?.email || '',
      })
      setError('')
      setShowForm(true)
    } catch (editError) {
      setDetailError(editError.message)
    } finally {
      setOpeningEdit(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    const payload = { ...formData, status }

    try {
      if (editingId) {
        await updateItem(editingId, payload)
        setNotification({ type: 'success', message: 'Report updated successfully.' })
      } else {
        await createItem(payload)
        setNotification({ type: 'success', message: 'Report submitted successfully.' })
      }
      setShowForm(false)
      setEditingId(null)
      setFormData(emptyForm)
      await loadItems()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteItem(deleteId)
      setDeleteId(null)
      setNotification({ type: 'success', message: 'Report deleted successfully.' })
      await loadItems()
    } catch (deleteError) {
      setDeleteError(deleteError.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleLogin = (token, loggedInUser) => {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser))
    setUser(loggedInUser)
    setNotification({ type: 'success', message: `Welcome, ${loggedInUser.name}.` })
  }

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('findit_token')
    localStorage.removeItem(USER_KEY)
    setUser(null)
    setSelectedItem(null)
    setShowForm(false)
    setDeleteId(null)
  }

  const isOwner = useCallback((item) => {
    if (!item?.user || !user) return false

    const ownerId = typeof item.user === 'object'
      ? item.user._id || item.user.id
      : item.user
    const currentUserId = user.id || user._id

    return Boolean(ownerId && currentUserId &&
      String(ownerId) === String(currentUserId))
  }, [user])

  const getEmoji = (category) => {
    const icons = {
      Electronics: '📱',
      Bags: '🎒',
      Documents: '📄',
      Accessories: '⌚',
      Clothing: '👕',
      Other: '📦',
    }
    return icons[category] || '📦'
  }

  const counts = useMemo(() => ({
    total: items.length,
    lost: items.filter((item) => item.status === 'Lost').length,
    found: items.filter((item) => item.status === 'Found').length,
    mine: items.filter(isOwner).length,
  }), [items, isOwner])

  if (authLoading && !user) {
    return <div className="auth-container"><p role="status">Checking your session...</p></div>
  }

  if (!user) {
    return authMode === 'login'
      ? <Login onSwitch={() => setAuthMode('signup')} onLogin={handleLogin} />
      : <Signup onSwitch={() => setAuthMode('login')} />
  }

  return (
    <div className="app">
      <nav className="navbar">
        <a className="logo" href="#top">FindIt<span>.</span></a>
        <div className="nav-links">
          <a href="#dashboard">Dashboard</a>
          <a href="#reports">Reports</a>
          <a href="#my-reports">My Reports</a>
          <a href="#how-it-works">How It Works</a>
        </div>
        <div className="user-info">
          <span>{user.name}</span>
          <button className="btn btn-outline" type="button" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <header className="hero" id="top">
        <div className="hero-content">
          <p className="tagline">A COMMUNITY-DRIVEN LOST &amp; FOUND PLATFORM</p>
          <h1>Lost Something?<br /><span>Let's Find It.</span></h1>
          <p>Report lost belongings or help others recover items found in your community.</p>

          <div className="search-box">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by item, category, or location..."
            />
          </div>

          <div className="hero-buttons">
            <button className="btn btn-primary" type="button" onClick={() => openForm('Lost')}>
              Report Lost Item
            </button>
            <button className="btn btn-outline" type="button" onClick={() => openForm('Found')}>
              Report Found Item
            </button>
          </div>
        </div>
      </header>

      <section className="section" id="dashboard">
        <div className="section-heading">
          <div>
            <h2>Community <span>Dashboard</span></h2>
            <p>At a glance, {user.name}.</p>
          </div>
        </div>
        <div className="stats-grid">
          <article className="stat-card"><span>📋</span><p>Total Reports</p><h3>{loading || itemsError ? '—' : counts.total}</h3></article>
          <article className="stat-card"><span>🔎</span><p>Lost Items</p><h3>{loading || itemsError ? '—' : counts.lost}</h3></article>
          <article className="stat-card"><span>🤝</span><p>Found Items</p><h3>{loading || itemsError ? '—' : counts.found}</h3></article>
          <article className="stat-card"><span>👤</span><p>My Reports</p><h3>{loading || itemsError ? '—' : counts.mine}</h3></article>
        </div>
      </section>

      {notification && (
        <div className={`notification notification-${notification.type}`} role="status">
          <span>{notification.message}</span>
          <button type="button" aria-label="Dismiss notification" onClick={() => setNotification(null)}>×</button>
        </div>
      )}

      <section className="section how-it-works" id="how-it-works">
        <h2>How <span>FindIt</span> Works</h2>
        <p className="section-description">Three simple steps to reunite people with their belongings.</p>
        <div className="steps-grid">
          <article className="step-card"><span>🔎</span><h3>Search</h3><p>Browse reports or search for a lost item.</p></article>
          <article className="step-card"><span>📝</span><h3>Report</h3><p>Add a lost or found item with its details.</p></article>
          <article className="step-card"><span>🤝</span><h3>Reconnect</h3><p>Verify ownership and arrange a safe return.</p></article>
        </div>
      </section>

      <section className="section" id="reports">
        <div className="section-heading">
          <div>
            <h2>Community <span>Reports</span></h2>
            {loading ? <p>Loading reports...</p> : <p>Showing {filteredItems.length} reports</p>}
          </div>
          <a className="btn btn-outline" href="#my-reports">View My Reports</a>
        </div>

        <div className="filters">
          {['All', 'Lost', 'Found'].map((filter) => (
            <button
              key={filter}
              type="button"
              className={`filter-btn ${statusFilter === filter ? 'active' : ''}`}
              onClick={() => setStatusFilter(filter)}
            >
              {filter}
            </button>
          ))}
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="All">All Categories</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>

        <ItemGrid
          items={filteredItems}
          loading={loading}
          error={itemsError}
          onRetry={loadItems}
          onSelectItem={setSelectedItem}
          getEmoji={getEmoji}
        />
      </section>

      <section className="section" id="my-reports">
        <div className="section-heading">
          <div>
            <h2>My <span>Reports</span></h2>
            <p>{loading ? 'Loading your reports...' : `${counts.mine} report${counts.mine === 1 ? '' : 's'} created by you`}</p>
          </div>
          <button className="btn btn-primary" type="button" onClick={() => openForm('Lost')}>
            Create a Report
          </button>
        </div>
        <ItemGrid
          items={filteredItems.filter(isOwner)}
          loading={loading}
          error={itemsError}
          onRetry={loadItems}
          onSelectItem={setSelectedItem}
          getEmoji={getEmoji}
        />
      </section>

      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Item Details</h2>
              <button className="close-btn" type="button" onClick={() => setSelectedItem(null)}>×</button>
            </div>

            <div className="detail-emoji">{getEmoji(selectedItem.category)}</div>
            <h2>{selectedItem.title}</h2>
            <p><strong>Status:</strong> {selectedItem.status}</p>
            <p><strong>Category:</strong> {selectedItem.category}</p>
            <p><strong>Description:</strong> {selectedItem.description}</p>
            <p><strong>Location:</strong> {selectedItem.location}</p>
            <p><strong>Date:</strong> {selectedItem.date
              ? new Date(selectedItem.date).toLocaleDateString('en-IN')
              : 'Date unavailable'}</p>
            <p><strong>Reported by:</strong> {selectedItem.contactName}</p>
            <p className="privacy-note">
              Contact details are not displayed publicly in this version.
              Verify ownership before returning an item.
            </p>
            {detailError && <p className="form-error" role="alert">{detailError}</p>}

            {isOwner(selectedItem) && (
              <div className="modal-actions">
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => editItem(selectedItem)}
                  disabled={openingEdit}
                >
                  {openingEdit ? 'Loading...' : 'Edit Report'}
                </button>
                <button className="btn btn-danger" type="button" onClick={() => {
                  setDeleteError('')
                  setDeleteId(selectedItem._id)
                  setSelectedItem(null)
                }}>Delete Report</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Report' : `Report ${status} Item`}</h2>
              <button className="close-btn" type="button" onClick={closeForm} disabled={submitting}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              {error && <p className="form-error" role="alert">{error}</p>}
              <label>Item Name *</label>
              <input name="title" value={formData.title} onChange={handleChange} placeholder="Enter item name" required />

              <label>Description *</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Describe the item" required />

              <label>Category *</label>
              <select name="category" value={formData.category} onChange={handleChange}>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>

              <label>Location *</label>
              <input name="location" value={formData.location} onChange={handleChange} placeholder="Where was it lost or found?" required />

              <label>Date *</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} required />

              <label>Your Name *</label>
              <input name="contactName" value={formData.contactName} onChange={handleChange} placeholder="Enter your name" required />

              <label>Contact Email *</label>
              <input type="email" name="contactEmail" value={formData.contactEmail} onChange={handleChange} placeholder="Use a test email while developing" required />

              <button className="btn btn-primary submit-btn" type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : editingId ? 'Update Report' : 'Submit Report'}
              </button>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Delete Report?</h2>
            <p>Are you sure you want to delete this report? This cannot be undone.</p>
            {deleteError && <p className="form-error" role="alert">{deleteError}</p>}
            <div className="modal-actions">
              <button className="btn btn-outline" type="button" onClick={() => {
                setDeleteError('')
                setDeleteId(null)
              }} disabled={deleting}>Cancel</button>
              <button className="btn btn-danger" type="button" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <h2>FindIt<span>.</span></h2>
        <p>Helping people find what matters.</p>
        <p className="copyright">© 2026 FindIt. All Rights Reserved.</p>
      </footer>
    </div>
  )
}

export default App
