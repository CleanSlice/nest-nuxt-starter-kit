<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Users</h1>
      <Button @click="showCreateDialog = true">Create User</Button>
    </div>

    <div class="mb-4">
      <Input
        v-model="search"
        placeholder="Search users..."
        class="max-w-sm"
        @input="onSearch"
      />
    </div>

    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Status</TableHead>
            <TableHead class="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="userStore.isLoading">
            <TableCell colspan="5" class="text-center py-8 text-muted-foreground">
              Loading...
            </TableCell>
          </TableRow>
          <TableRow v-else-if="userStore.users.length === 0">
            <TableCell colspan="5" class="text-center py-8 text-muted-foreground">
              No users found
            </TableCell>
          </TableRow>
          <TableRow
            v-for="user in userStore.users"
            :key="user.id"
            class="cursor-pointer hover:bg-muted/50"
            @click="navigateTo(`/users/${user.id}`)"
          >
            <TableCell class="font-medium">{{ user.name }}</TableCell>
            <TableCell>{{ user.email }}</TableCell>
            <TableCell>
              <div class="flex gap-1">
                <Badge v-for="role in user.roles" :key="role" variant="secondary">
                  {{ role }}
                </Badge>
              </div>
            </TableCell>
            <TableCell>
              <Badge :variant="user.verified ? 'default' : 'outline'">
                {{ user.verified ? 'Verified' : 'Unverified' }}
              </Badge>
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                @click.stop="confirmDelete(user)"
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>

    <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-4">
      <Button
        variant="outline"
        size="sm"
        :disabled="userStore.currentPage <= 1"
        @click="changePage(userStore.currentPage - 1)"
      >
        Previous
      </Button>
      <span class="text-sm text-muted-foreground">
        Page {{ userStore.currentPage }} of {{ totalPages }}
      </span>
      <Button
        variant="outline"
        size="sm"
        :disabled="userStore.currentPage >= totalPages"
        @click="changePage(userStore.currentPage + 1)"
      >
        Next
      </Button>
    </div>

    <!-- Create User Dialog -->
    <div
      v-if="showCreateDialog"
      class="fixed inset-0 bg-background/80 flex items-center justify-center z-50"
      @click.self="showCreateDialog = false"
    >
      <Card class="w-full max-w-md p-6">
        <h2 class="text-lg font-semibold mb-4">Create User</h2>
        <form @submit.prevent="onCreate">
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium">Name</label>
              <Input v-model="createForm.name" placeholder="John Doe" required />
            </div>
            <div>
              <label class="text-sm font-medium">Email</label>
              <Input v-model="createForm.email" type="email" placeholder="john@example.com" required />
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-6">
            <Button variant="outline" type="button" @click="showCreateDialog = false">
              Cancel
            </Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
const userStore = useUserStore();

const search = ref('');
const showCreateDialog = ref(false);
const createForm = reactive({ name: '', email: '' });

const totalPages = computed(() =>
  Math.ceil(userStore.totalUsers / userStore.perPage),
);

let searchTimeout: ReturnType<typeof setTimeout>;

function onSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    userStore.fetchUsers({ search: search.value, page: 1 });
  }, 300);
}

function changePage(page: number) {
  userStore.fetchUsers({ page, search: search.value });
}

async function onCreate() {
  await userStore.createUser(createForm);
  showCreateDialog.value = false;
  createForm.name = '';
  createForm.email = '';
}

async function confirmDelete(user: { id: string; name: string }) {
  if (window.confirm(`Delete user "${user.name}"?`)) {
    await userStore.deleteUser(user.id);
  }
}

onMounted(() => {
  userStore.fetchUsers();
});
</script>
