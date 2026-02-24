import {
  getUsers,
  getUser,
  createUser as createUserApi,
  updateUser as updateUserApi,
  deleteUser as deleteUserApi,
} from '#api/data/repositories/api';
import type {
  CreateUserDto,
  UpdateUserDto,
  GetUsersData,
} from '#api/data/repositories/api';

interface UserResponse {
  id: string;
  email: string;
  name: string;
  roles: string[];
  verified: boolean;
  banned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse {
  data: UserResponse[];
  total: number;
  page: number;
  perPage: number;
}

export const useUserStore = defineStore('user', () => {
  const users = ref<UserResponse[]>([]);
  const currentUser = ref<UserResponse | null>(null);
  const totalUsers = ref(0);
  const currentPage = ref(1);
  const perPage = ref(10);
  const isLoading = ref(false);

  async function fetchUsers(filter?: GetUsersData['query']) {
    isLoading.value = true;
    try {
      const { data } = await getUsers({
        query: {
          page: filter?.page || currentPage.value,
          perPage: filter?.perPage || perPage.value,
          search: filter?.search,
          email: filter?.email,
        },
      });
      if (data) {
        const response = data as PaginatedResponse;
        users.value = response.data;
        totalUsers.value = response.total;
        currentPage.value = response.page;
        perPage.value = response.perPage;
      }
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchUser(id: string) {
    isLoading.value = true;
    try {
      const { data } = await getUser({ path: { id } });
      if (data) {
        currentUser.value = data as UserResponse;
      }
    } finally {
      isLoading.value = false;
    }
  }

  async function createUser(dto: CreateUserDto) {
    const { data } = await createUserApi({ body: dto });
    if (data) {
      await fetchUsers();
    }
    return data;
  }

  async function updateUser(id: string, dto: UpdateUserDto) {
    const { data } = await updateUserApi({ path: { id }, body: dto });
    if (data) {
      currentUser.value = data as UserResponse;
      await fetchUsers();
    }
    return data;
  }

  async function deleteUser(id: string) {
    await deleteUserApi({ path: { id } });
    currentUser.value = null;
    await fetchUsers();
  }

  return {
    users,
    currentUser,
    totalUsers,
    currentPage,
    perPage,
    isLoading,
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
  };
});
