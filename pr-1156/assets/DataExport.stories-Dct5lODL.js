const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./dataExportWorkbook-CPyXi5qN.js","./preload-helper-D2yxXLVK.js","./dataImport-BF0nL3eW.js","./transaction-v5q89a69.js","./transactionAttachmentLimits-CU9akmh1.js","./sharedErrorMessages-1yTvmKpx.js","./transactionAmountInput-DQ1Yq6ll.js","./dataImportExportMessages-BwzOFhCH.js","./account-kTnxwOL5.js","./errors-CnHTd7cw.js","./ledger-vCOwyEdk.js","./formValidation-CKylcdjK.js","./themeColorTokens-CToUvU_n.js","./dataExport-DxZKpNd2.js","./appError-CzDbWkbV.js","./accounts-Dk2QA-HD.js","./accounts-Sd-G5BwS.js","./ledgers-D3P1mq-2.js","./categoryNames-BSS7MKSq.js","./categoryEmojis-97W7iB8O.js","./transactions-CE_ZLU3B.js","./dateTime-D4bH2MPn.js"])))=>i.map(i=>d[i]);
import{c as e,i as t,n,t as r}from"./preload-helper-D2yxXLVK.js";import{t as i}from"./react-DAMDAfNa.js";import{t as a}from"./jsx-runtime-Dwpk6tgA.js";import{n as o,t as s}from"./Typography-B_0Lz4TE.js";import{n as c,t as l}from"./FormControlLabel-B5h8Q2U5.js";import{o as u,r as d}from"./paths-Cn5DhC5u.js";import{G as f,W as p,d as m,m as h}from"./iframe-CNJB6aIH.js";import{n as g,t as _}from"./Stack-CedAN9w3.js";import{n as v,t as y}from"./actionPendingMessages-B03PK8BF.js";import{n as b,t as x}from"./ActionButton-QcdTtLnf.js";import{n as S,t as ee}from"./SectionCard-D2DAxWB9.js";import{n as te,t as ne}from"./DownloadRounded-FMr959CH.js";import{n as re,t as C}from"./SettingsPageLayout-qiq_Kk1v.js";import{n as w,t as T}from"./Switch-DKnl9CEi.js";import{d as E,f as D,t as O}from"./dataImportExportMessages-BwzOFhCH.js";import{i as k,n as A,r as j,t as M}from"./dataExport-DxZKpNd2.js";function N(){let e={transactionAt:`2026-09-19T01:02:03.000Z`,recorderName:`历史记账人`,note:`=原样备注`,merchantId:`shop`};return{accounts:[{id:`cash`,name:`现金`,currency:`JPY`,type:`cash`,holder:{name:`小明`,displayColor:`sky`}},{id:`bank`,name:`存款`,currency:`JPY`,type:`bank`,holder:{name:`小红`,displayColor:`rose`}},{id:`none`,name:`公共账户`,currency:`CNY`,type:`other`,holder:null}],categories:[{id:`food`,name:`🍚 饮食`,parent_id:null,type:`expense`},{id:`lunch`,name:`午餐`,parent_id:`food`,type:`expense`},{id:`salary`,name:`工资`,parent_id:null,type:`income`}],merchants:[{id:`shop`,name:`商家展示名`,tagNames:[`餐饮`,`附近`]}],records:[{...e,id:`normal`,type:`normal`,items:[{categoryId:`lunch`,amount:`123.45`},{categoryId:`food`,amount:`50`},{categoryId:`salary`,amount:`10`}],payments:[{accountId:`cash`,amount:`163.45`}]},{...e,id:`transfer`,type:`transfer`,merchantId:null,items:[{accountId:`bank`,categoryId:null,amount:`300`,balanceDelta:`300`},{accountId:`cash`,categoryId:null,amount:`300`,balanceDelta:`-300`}]},{...e,id:`adjustment`,type:`balance_adjustment`,merchantId:null,items:[{accountId:`none`,categoryId:null,amount:`12.34`,balanceDelta:`-12.34`}]}]}}function P(){return{accounts:[],categories:[],merchants:[],records:[]}}var F=t((()=>{}));function I(e){let t=(0,L.useRef)(!1),[n,i]=(0,L.useState)(!1),[a,o]=(0,L.useState)(null),[s,c]=(0,L.useState)(!1),[l,u]=(0,L.useState)(!1),[d,f]=(0,L.useState)(null);async function p(){if(!t.current){t.current=!0,i(!0),o(null),c(!1),f(null);try{let t=await e(l);if(!t.data){o(t.error??k.exportFailed);return}let{buildDataExportWorkbook:n}=await r(async()=>{let{buildDataExportWorkbook:e}=await import(`./dataExportWorkbook-CPyXi5qN.js`);return{buildDataExportWorkbook:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21]),import.meta.url),i=l?await n(t.data,{onPhotoProgress:(e,t)=>{t>0&&f({done:e,total:t})}}):await n(t.data),a=new Blob([i],{type:`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`}),s=URL.createObjectURL(a),u=document.createElement(`a`);try{u.href=s,u.download=O.fileName,document.body.appendChild(u),u.click(),c(!0)}finally{u.remove(),setTimeout(()=>URL.revokeObjectURL(s),1e3)}}catch(e){o(e instanceof j||e instanceof A?e.message:k.downloadFailed)}finally{t.current=!1,i(!1),f(null)}}}return{includePhotos:l,setIncludePhotos:u,photoProgress:d,isExporting:n,error:a,hasDownloaded:s,handleExport:p,closeError:()=>o(null)}}var L,R=t((()=>{L=e(i()),D(),M(),n()}));function z({exportAction:e}){let{includePhotos:t,setIncludePhotos:n,photoProgress:r,isExporting:i,error:a,hasDownloaded:s,handleExport:l,closeError:d}=I(e);return(0,B.jsxs)(C,{back:{href:u.settingsData,label:E.backToEntry},title:O.title,subtitle:O.subtitle,children:[(0,B.jsxs)(g,{spacing:2.5,children:[(0,B.jsx)(ee,{children:(0,B.jsxs)(g,{spacing:1.5,children:[(0,B.jsx)(o,{sx:{fontWeight:700},children:O.scopeTitle}),[O.scope,O.format,O.empty].map(e=>(0,B.jsx)(o,{color:`textSecondary`,variant:`body2`,children:e},e)),(0,B.jsx)(c,{control:(0,B.jsx)(w,{checked:t,disabled:i,onChange:(e,t)=>n(t)}),label:O.includePhotos}),t?(0,B.jsx)(o,{color:`textSecondary`,variant:`body2`,children:O.photoSizeHint}):null,(0,B.jsx)(x,{pending:i,pendingLabel:y.export,onClick:l,startIcon:(0,B.jsx)(ne,{}),variant:`contained`,fullWidth:!0,children:O.button}),r?(0,B.jsx)(o,{role:`status`,color:`textSecondary`,variant:`body2`,children:O.photoProgress(r.done,r.total)}):null]})}),s?(0,B.jsx)(f,{severity:`success`,children:O.success}):null]}),(0,B.jsx)(m,{open:a!==null,onClose:d,title:O.failureTitle,description:a})]})}var B,V=t((()=>{B=a(),te(),p(),l(),T(),_(),s(),b(),v(),D(),d(),h(),S(),re(),R(),z.__docgenInfo={description:``,methods:[],displayName:`DataExportTemplate`,props:{exportAction:{required:!0,tsType:{name:`DataExportAction`},description:``}}}})),H,U,W,G,K,q,J,Y,X,Z,Q,$;t((()=>{M(),F(),V(),{userEvent:H,within:U}=__STORYBOOK_MODULE_TEST__,W=async()=>({data:N()}),G={title:`Templates/Settings/DataExportTemplate`,component:z,args:{exportAction:W}},K=async({canvasElement:e})=>{await H.click(U(e).getByRole(`button`,{name:`导出 xlsx`}))},q={name:`默认（可下载示例）`},J={name:`导出照片开关`,play:async({canvasElement:e})=>{await H.click(U(e).getByRole(`switch`,{name:`导出照片`}))}},Y={name:`正在下载照片`,args:{exportAction:async()=>({data:{...N(),photos:[{recordId:`normal`,sortOrder:0,fullUrl:`https://example.com/photo.jpg`}]}})},play:async({canvasElement:e})=>{let t=globalThis.fetch;globalThis.fetch=()=>new Promise(()=>{});try{let t=U(e);await H.click(t.getByRole(`switch`,{name:`导出照片`})),await H.click(t.getByRole(`button`,{name:`导出 xlsx`})),await t.findByText(`正在下载照片 0/1`)}finally{globalThis.fetch=t}}},X={name:`导出中`,args:{exportAction:()=>new Promise(()=>{})},play:K},Z={name:`导出失败`,args:{exportAction:async()=>({error:k.exportFailed})},play:K},Q={name:`空账本（可下载表头）`,args:{exportAction:async()=>({data:P()})}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  name: "默认（可下载示例）"
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  name: "导出照片开关",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("switch", {
      name: "导出照片"
    }));
  }
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "正在下载照片",
  args: {
    exportAction: async () => ({
      data: {
        ...createDataExportFixture(),
        photos: [{
          recordId: "normal",
          sortOrder: 0,
          fullUrl: "https://example.com/photo.jpg"
        }]
      }
    })
  },
  play: async ({
    canvasElement
  }) => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = () => new Promise<Response>(() => {});
    try {
      const canvas = within(canvasElement);
      await userEvent.click(canvas.getByRole("switch", {
        name: "导出照片"
      }));
      await userEvent.click(canvas.getByRole("button", {
        name: "导出 xlsx"
      }));
      await canvas.findByText("正在下载照片 0/1");
    } finally {
      globalThis.fetch = originalFetch;
    }
  }
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: "导出中",
  args: {
    exportAction: () => new Promise(() => {})
  },
  play: startExport
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  name: "导出失败",
  args: {
    exportAction: async () => ({
      error: dataExportErrorMessages.exportFailed
    })
  },
  play: startExport
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  name: "空账本（可下载表头）",
  args: {
    exportAction: async () => ({
      data: createEmptyDataExport()
    })
  }
}`,...Q.parameters?.docs?.source}}},$=[`Default`,`IncludePhotos`,`DownloadingPhotos`,`Exporting`,`Failed`,`Empty`]}))();export{q as Default,Y as DownloadingPhotos,Q as Empty,X as Exporting,Z as Failed,J as IncludePhotos,$ as __namedExportsOrder,G as default};