import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{R as n,z as r}from"./iframe-Bl3uyF39.js";import{n as i,t as a}from"./ReceiptPhotoSection-CnL03qX7.js";function o(e,t=`uploaded`){return{attachmentId:t===`uploaded`?`00000000-0000-4000-8000-${String(e+1).padStart(12,`0`)}`:void 0,fullUrl:l,key:`receipt-${e}`,previewUrl:l,source:`saved`,status:t}}function s(e,t=null){return{photos:e,error:t,loading:!1,touched:!1,loadFailed:!1,savingPhotos:!1,addFiles:()=>{},remove:()=>{},retry:()=>{},prepareForSave:async()=>!0}}var c,l,u,d,f,p,m,h,g,_;e((()=>{c=t(),n(),i(),l=`data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22180%22%20height%3D%22240%22%3E%3Crect%20width%3D%22180%22%20height%3D%22240%22%20fill%3D%22%23f5f0e8%22%2F%3E%3Ctext%20x%3D%2228%22%20y%3D%2250%22%20font-size%3D%2218%22%20fill%3D%22%23453b31%22%3E7-Eleven%3C%2Ftext%3E%3Cpath%20d%3D%22M22%2068h136M22%2093h118M22%20120h136M22%20145h90M22%20176h136%22%20stroke%3D%22%23b1a69a%22%20stroke-width%3D%224%22%2F%3E%3C%2Fsvg%3E`,u={title:`Organisms/Transactions/ReceiptPhotoSection`,component:a,decorators:[e=>(0,c.jsx)(r,{sx:{bgcolor:`#fffdf8`,maxWidth:390,p:2},children:(0,c.jsx)(e,{})})],args:{controller:s([])},parameters:{viewport:{defaultViewport:`mobile2`}}},d={name:`尚无照片`},f={name:`已添加两张照片`,args:{controller:s([o(0),o(1)])}},p={name:`上传中的遮罩`,args:{controller:s([o(0),o(1,`uploading`)])}},m={name:`上传失败与重试`,args:{controller:s([o(0),o(1,`failed`)],`1 张照片上传失败，请重试或移除`)}},h={name:`已满五张`,args:{controller:s(Array.from({length:5},(e,t)=>o(t)))}},g={name:`详情只读缩略图`,args:{controller:s([o(0),o(1)]),readOnly:!0}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  name: "尚无照片"
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  name: "已添加两张照片",
  args: {
    controller: photoState([example(0), example(1)])
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  name: "上传中的遮罩",
  args: {
    controller: photoState([example(0), example(1, "uploading")])
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: "上传失败与重试",
  args: {
    controller: photoState([example(0), example(1, "failed")], "1 张照片上传失败，请重试或移除")
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  name: "已满五张",
  args: {
    controller: photoState(Array.from({
      length: 5
    }, (_, index) => example(index)))
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  name: "详情只读缩略图",
  args: {
    controller: photoState([example(0), example(1)]),
    readOnly: true
  }
}`,...g.parameters?.docs?.source}}},_=[`Empty`,`WithPhotos`,`Uploading`,`FailedRetry`,`Full`,`ReadOnly`]}))();export{d as Empty,m as FailedRetry,h as Full,g as ReadOnly,p as Uploading,f as WithPhotos,_ as __namedExportsOrder,u as default};