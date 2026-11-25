import { apiRequest } from './api'
import { TOKEN_KEY } from './authConfig'

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);
export { TOKEN_KEY }

export const getItems = async () => {
  const result = await apiRequest('/items')
  return result.data
};

export const getItemById = async (id) => {
  const result = await apiRequest(`/items/${encodeURIComponent(id)}`)
  return result.data
};

export const getOwnedItemDetails = async (id) => {
  const result = await apiRequest(`/items/${encodeURIComponent(id)}/private`, {
    auth: true,
  })
  return result.data
}

export const createItem = async (itemData) => {
  const result = await apiRequest('/items', {
    method: "POST",
    auth: true,
    body: JSON.stringify(itemData),
  });

  return result.data;
};

export const updateItem = async (id, itemData) => {
  const result = await apiRequest(`/items/${encodeURIComponent(id)}`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify(itemData),
  });

  return result.data;
};

export const deleteItem = async (id) => {
  return apiRequest(`/items/${encodeURIComponent(id)}`, {
    method: "DELETE",
    auth: true,
  });
};
