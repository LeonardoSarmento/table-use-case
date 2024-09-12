import axios, { AxiosError, AxiosHeaders, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { getStoredToken } from './hooks/auth';

const api = axios.create({
  baseURL: 'https://jsonplaceholder.typicode.com/',
});

const setAxiosHeader = (config: InternalAxiosRequestConfig<any>): InternalAxiosRequestConfig<any> => {
  const token = getStoredToken();
  if (token) (config.headers as AxiosHeaders).set('Authorization', `Bearer ${token}`);
  return config;
};

api.interceptors.request.use(
  async (config) => {
    return setAxiosHeader(config);
  },
  (error) => {
    console.log('error request: ', error);
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  async (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    console.log('error response: ', error);
    if (error instanceof AxiosError) {
      toast.error('Ocorreu algum erro na sua requisição', { description: `error de status ${error.status}` });
    }
    return error;
  },
);

export async function get(endpoint: string) {
  try {
    const { data, status, statusText } = await api.get(endpoint);
    return { data, status, statusText };
  } catch (error) {
    if (error instanceof AxiosError) {
      const err = error as AxiosError;
      console.log('GET Error', err.response?.data);
    } else {
      throw error;
    }
  }
}

export async function getById(startpoint: string, id: number) {
  try {
    const response = await api.get(`${startpoint}/${id}`);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const err = error as AxiosError;
      console.log('GetById Error', err.response?.data);
    } else {
      throw error;
    }
  }
}

export async function post(endpoint: string, body: any) {
  try {
    const { data, status, statusText } = await api.post(endpoint, body);
    return { data, status, statusText };
  } catch (error) {
    if (error instanceof AxiosError) {
      const err = error as AxiosError;
      console.log('POST Error', err.response);
    }
  }
}

export async function put(endpoint: string, body: any) {
  try {
    const { data, status, statusText } = await api.put(endpoint, body);
    return { data, status, statusText };
  } catch (error) {
    if (error instanceof AxiosError) {
      const err = error as AxiosError;
      console.log('PUT Error', err.response?.data);
    } else {
      throw error;
    }
  }
}

export async function remove(endpoint: string, id: number) {
  try {
    return await api.delete(`${endpoint}/${id}`);
  } catch (error) {
    if (error instanceof AxiosError) {
      const err = error as AxiosError;
      console.log('Delete Error', err.response?.data);
    } else {
      throw error;
    }
  }
}

export async function patch(endpoint: string, body: any) {
  try {
    return await api.patch(endpoint, body);
  } catch (error) {
    if (error instanceof AxiosError) {
      const err = error as AxiosError;
      console.log('Patch Error', err.response?.data);
    } else {
      throw error;
    }
  }
}

export default api;
