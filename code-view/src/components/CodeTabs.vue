<script>
export default {
  props: {
    readMe: "",
  },
  data: () => ({
    tab: ""
  })
}
</script>

<template>
  <div class="q-pa-md">
    <div class="q-gutter-y-md">
      <q-card>
        <q-tabs v-model="tab" inline-label class="bg-primary text-white shadow-2">
          <q-tab name="mails" icon="mail" label="Mails"/>
          <q-tab name="alarms" icon="alarm" label="Alarms"/>
          <q-tab name="movies" icon="movie" label="Movies"/>
          <q-tab name="photos" icon="photo" label="Photos"/>
          <q-tab name="videos" icon="slow_motion_video" label="Videos"/>
          <q-tab name="addressbook" icon="people" label="Address Book"/>
        </q-tabs>
        <q-separator/>

        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="mails">
            <div class="text-h6">Mails</div>
            {{ readMe }}
          </q-tab-panel>

          <q-tab-panel name="alarms">
            <div class="text-h6">Alarms</div>
            Lorem ipsum dolor sit amet consectetur adipisicing elit.
          </q-tab-panel>

          <q-tab-panel name="movies">
            <div class="text-h6">Movies</div>
            Lorem ipsum dolor sit amet consectetur adipisicing elit.
          </q-tab-panel>
        </q-tab-panels>
      </q-card>
    </div>
  </div>
</template>

<style scoped>

</style>
