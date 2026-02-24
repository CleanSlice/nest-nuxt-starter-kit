<template>
  <div>
    <div class="mb-6">
      <Button variant="ghost" @click="navigateTo('/users')">
        &larr; Back to Users
      </Button>
    </div>

    <div v-if="userStore.isLoading" class="text-center py-12 text-muted-foreground">
      Loading...
    </div>

    <div v-else-if="!userStore.currentUser" class="text-center py-12 text-muted-foreground">
      User not found
    </div>

    <template v-else>
      <Card class="max-w-2xl">
        <div class="p-6">
          <div class="flex items-center justify-between mb-6">
            <h1 class="text-2xl font-bold">{{ userStore.currentUser.name }}</h1>
            <div class="flex gap-2">
              <Button variant="outline" @click="isEditing = !isEditing">
                {{ isEditing ? 'Cancel' : 'Edit' }}
              </Button>
              <Button variant="destructive" @click="onDelete">
                Delete
              </Button>
            </div>
          </div>

          <Separator class="mb-6" />

          <!-- View Mode -->
          <div v-if="!isEditing" class="space-y-4">
            <div>
              <span class="text-sm text-muted-foreground">Email</span>
              <p>{{ userStore.currentUser.email }}</p>
            </div>
            <div>
              <span class="text-sm text-muted-foreground">Roles</span>
              <div class="flex gap-1 mt-1">
                <Badge v-for="role in userStore.currentUser.roles" :key="role" variant="secondary">
                  {{ role }}
                </Badge>
              </div>
            </div>
            <div class="flex gap-4">
              <div>
                <span class="text-sm text-muted-foreground">Verified</span>
                <p>
                  <Badge :variant="userStore.currentUser.verified ? 'default' : 'outline'">
                    {{ userStore.currentUser.verified ? 'Yes' : 'No' }}
                  </Badge>
                </p>
              </div>
              <div>
                <span class="text-sm text-muted-foreground">Banned</span>
                <p>
                  <Badge :variant="userStore.currentUser.banned ? 'destructive' : 'outline'">
                    {{ userStore.currentUser.banned ? 'Yes' : 'No' }}
                  </Badge>
                </p>
              </div>
            </div>
            <div>
              <span class="text-sm text-muted-foreground">Created</span>
              <p>{{ new Date(userStore.currentUser.createdAt).toLocaleDateString() }}</p>
            </div>
          </div>

          <!-- Edit Mode -->
          <form v-else @submit.prevent="onUpdate">
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium">Name</label>
                <Input v-model="editForm.name" required />
              </div>
              <div>
                <label class="text-sm font-medium">Email</label>
                <Input v-model="editForm.email" type="email" required />
              </div>
              <div class="flex items-center gap-4">
                <label class="flex items-center gap-2">
                  <input v-model="editForm.verified" type="checkbox" class="rounded" />
                  <span class="text-sm">Verified</span>
                </label>
                <label class="flex items-center gap-2">
                  <input v-model="editForm.banned" type="checkbox" class="rounded" />
                  <span class="text-sm">Banned</span>
                </label>
              </div>
            </div>
            <div class="flex justify-end gap-2 mt-6">
              <Button variant="outline" type="button" @click="isEditing = false">Cancel</Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </div>
      </Card>
    </template>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ id: string }>();

const userStore = useUserStore();
const isEditing = ref(false);

const editForm = reactive({
  name: '',
  email: '',
  verified: false,
  banned: false,
});

function populateForm() {
  if (userStore.currentUser) {
    editForm.name = userStore.currentUser.name;
    editForm.email = userStore.currentUser.email;
    editForm.verified = userStore.currentUser.verified;
    editForm.banned = userStore.currentUser.banned;
  }
}

async function onUpdate() {
  await userStore.updateUser(props.id, editForm);
  isEditing.value = false;
}

async function onDelete() {
  if (window.confirm(`Delete user "${userStore.currentUser?.name}"?`)) {
    await userStore.deleteUser(props.id);
    navigateTo('/users');
  }
}

watch(() => props.id, async (newId) => {
  await userStore.fetchUser(newId);
  populateForm();
}, { immediate: true });
</script>
