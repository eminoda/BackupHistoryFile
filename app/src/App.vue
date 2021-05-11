<template>
  <div id="app">
    <el-form label-width="auto">
      <el-form-item label="服务地址">
        <el-select v-model="model.url" placeholder="请选择">
          <el-option v-for="item in servers" :key="item.value" :label="item.label" :value="item.value">
            <el-tag>{{ item.label }}</el-tag>
            <span style="margin-left:10px;">{{ item.value }}</span>
          </el-option>
        </el-select>
        <!-- <el-input v-model="model.url" placeholder="127.0.0.1:3000">
          <template slot="prepend">http://</template>
        </el-input> -->
      </el-form-item>
      <el-form-item>
        <el-row type="flex" justify="start">
          <el-col :span="6">
            <el-upload
              class="upload-demo"
              :action="model.url + '/deploy/issp'"
              multiple
              :limit="1"
              :on-exceed="handleExceed"
              :before-upload="beforeUploadHandle"
              :on-success="successHandle"
              :on-remove="removeHandle"
            >
              <el-button size="small" type="primary">ISSP上传</el-button>
              <!-- <div slot="tip" class="el-upload__tip">只能上传jpg/png文件，且不超过500kb</div> -->
            </el-upload>
          </el-col>
          <el-col :span="6">
            <el-upload
              class="upload-demo"
              :action="model.url + '/deploy/config'"
              multiple
              :limit="1"
              :on-exceed="handleExceed"
              :before-upload="beforeUploadHandle"
              :on-success="successHandle"
              :on-remove="removeHandle"
            >
              <el-button size="small" type="primary">配置上传</el-button>
              <!-- <div slot="tip" class="el-upload__tip">只能上传jpg/png文件，且不超过500kb</div> -->
            </el-upload>
          </el-col>
        </el-row>
      </el-form-item>
      <el-form-item> </el-form-item>
      <div>
        <h3>上传结果：</h3>
        <div style="height: 150px;">
          <el-steps direction="vertical">
            <el-step v-for="(item, index) in result" :key="index" :title="item"></el-step>
          </el-steps>
        </div>
      </div>
    </el-form>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'App',
  components: {},
  data() {
    return {
      model: {
        url: '',
        file: '',
      },
      result: '',
      servers: [],
    };
  },
  methods: {
    beforeUploadHandle(file) {
      if (!this.model.url) {
        this.$message.error('请设置服务器地址');
        return false;
      }
      const isZip = file.name.split('.').includes('zip');
      if (!isZip) {
        this.$message.error('上传文件后缀为 zip');
        return false;
      }
    },
    successHandle(response) {
      this.result = response.msg;
    },
    handleExceed() {
      this.$message.warning(`当前限制选择 1 个文件，请删除旧文件后，重新上传`);
    },
    removeHandle() {
      this.result = [];
    },
  },
  created() {
    // const data = [
    //   { ip: '172.20.2.45', name: 'YZT_ISSP_4' },
    //   { ip: '172.20.2.34', name: 'YZT_ISSP_3' },
    //   { ip: '172.20.2.44', name: 'YZT_ISSP_2' },
    //   { ip: '172.20.2.41', name: 'YZT_ISSP_1' },
    //   { ip: '127.0.0.1', name: '本机' },
    // ];
    // data.forEach((item) => {
    //   this.servers.push({
    //     label: item.name,
    //     value: 'http://' + item.ip + ':3000',
    //   });
    // });
    // return;
    const self = this;
    axios
      .get('/config')
      .then(function(response) {
        response.data.data.servers.forEach((item) => {
          self.servers.push({
            label: item.name,
            value: 'http://' + item.ip + ':3000',
          });
        });
      })
      .catch(function(error) {
        // handle error
        console.log(error);
      });
  },
};
</script>

<style>
#app {
  width: 50%;
  margin: auto;
}
</style>
