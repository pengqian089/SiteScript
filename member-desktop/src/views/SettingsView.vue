<script>
import {setNotifier, success, handleResponse, warning, fetchGetAsync, fetchPostAsync} from "../../common";
import {useNotifier} from "vuetify-notifier";
import _ from "lodash";
import {VSkeletonLoader} from 'vuetify/labs/VSkeletonLoader';

export default {
  components: {VSkeletonLoader},
  data: () => ({
    notifier: useNotifier(),
    isLoading: true,
    saving: false,
    uploading: false,
    changing: false,
    signOuting: false,
    active: 0,
    userInfo: {},
    pwd: {},
    unbinding: false,
    pinCode: "",
    tab: null,
  }),
  mounted() {
    setNotifier(this.notifier);
    this.$nextTick(async function () {
      await this.getUserInfo();
    });
  },
  methods: {
    /**
     * 保存用户信息
     * */
    async saveInfo(values) {
      if (_.isEmpty(this.userInfo.id)) {
        warning("账号不见了");
        return;
      }
      if (_.isEmpty(this.userInfo.name)) {
        warning("请填写昵称");
        return;
      }
      let formData = new FormData();
      for (let item in this.userInfo) {
        formData.append(item, this.userInfo[item]);
      }
      this.saving = true;
      // let response = await fetch("/account/UpdateInfo", {
      //   method: "post",
      //   body: formData
      // });

      // let that = this;
      //await handleResponse(response, () => that.saving = false);
      await fetchPostAsync({
        url: "/account/UpdateInfo",
        formData: formData
      });

      success("信息更新成功");
      this.saving = false;
    },
    /**
     * 修改密码
     * */
    async changePassword(values) {
      this.changing = true;
      let formData = new FormData();
      for (let item in values) {
        formData.append(item, values[item]);
      }
      let response = await fetch("/account/ChangePassword", {
        method: "post",
        body: formData
      });
      let that = this;
      await handleResponse(response, () => that.changing = false);
      success("密码修改成功");
      this.pwd = {};
      this.changing = false;
    },
    /*
    * 上传头像前的校验
    * @param {File} file
    * */
    uploadAvatarBefore(file) {
      if (!file.type.startsWith("image")) {
        warning('请上传图片');
        return false;
      }
      return true;
    },
    /**
     * 上传头像
     * */
    async uploadAvatar(file) {
      this.uploading = true;
      let formData = new FormData();
      formData.append("avatar", file.file);
      let response = await fetch("/account/UpdateAvatar", {
        method: "post",
        body: formData
      });

      let that = this;
      this.userInfo.avatar = await handleResponse(response, () => that.uploading = false);
      this.uploading = false;
      success("头像更新成功");
    },
    /**
     * 退出账号
     * */
    async signOut() {

      let result = await this.notifier.confirm(`确定要退出账号吗`);
      if (result !== true) return;

      this.signOuting = true;
      let response = await fetch("/account/LogOut", {method: "post"});
      if (response.ok) {
        location.href = "/";
      } else {
        warning(response.statusText);
      }
      this.signOuting = false;
    },
    /**
     * 获取用户信息
     * */
    async getUserInfo() {
      this.isLoading = true;
      let that = this;
      this.userInfo = await fetchGetAsync({
        url: "/account/GetUserInfo", callback: () => {
          that.isLoading = false
        }
      });
      this.userInfo.sex = this.userInfo.sex.toString();
      this.isLoading = false;
    },
    /*
    * 解绑二次验证
    * */
    async unbindTwoFactor() {
      let formData = new FormData();
      formData.append("pinCode", this.pinCode);
      this.unbinding = true;
      let response = await fetch("/unbind-two-factor", {
        method: "post",
        body: formData
      });
      let that = this;

      function clear() {
        that.pinCode = "";
        that.unbinding = false;
      }

      await handleResponse(response, () => clear());
      success("解绑成功");
      clear();
    }
  }
}
</script>

<template>
  <v-skeleton-loader :loading="isLoading" type="paragraph" style="width: 100%">
    <v-card class="settings">
      <v-tabs
          v-model="tab"
          bg-color="primary"
      >
        <v-tab value="information">我的资料</v-tab>
        <v-tab value="avatar">头像</v-tab>
        <v-tab value="password">密码</v-tab>
        <v-tab value="unbindTwoFactor">解绑二次验证</v-tab>
        <v-tab value="logout">退出</v-tab>
      </v-tabs>

      <v-card-text>
        <v-window v-model="tab">
          <v-window-item value="information">
            <form @submit.prevent="saveInfo">
              <v-text-field
                  v-model="userInfo.id"
                  label="账号"
                  readonly
              ></v-text-field>

              <v-text-field
                  v-model="userInfo.name"
                  label="昵称"
              ></v-text-field>
              <v-radio-group inline label="性别" v-model="userInfo.sex">
                <v-radio label="男" value="0"></v-radio>
                <v-radio label="女" value="1"></v-radio>
              </v-radio-group>
              <v-textarea label="签名" v-model="userInfo.sign"></v-textarea>
              <v-btn class="me-4" type="submit" :loading="saving" color="secondary">
                保存
              </v-btn>
            </form>
          </v-window-item>

          <v-window-item value="avatar">
            头像
          </v-window-item>

          <v-window-item value="password">
            密码
          </v-window-item>
          <v-window-item value="unbindTwoFactor">
            解绑二次验证
          </v-window-item>
          <v-window-item value="logout">
            退出
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-skeleton-loader>
</template>

<style scoped>
.settings {
  margin: 1em;
  width: 100%;
}
</style>