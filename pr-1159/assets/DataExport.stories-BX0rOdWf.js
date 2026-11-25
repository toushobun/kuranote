const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./dataExportWorkbook-By7EfVAg.js","./preload-helper-D2yxXLVK.js","./dataImport-Cpcyqd4n.js","./transaction-v5q89a69.js","./transactionAttachmentLimits-CU9akmh1.js","./sharedErrorMessages-1yTvmKpx.js","./transactionAmountInput-DQ1Yq6ll.js","./dataImportExportMessages-Bo9yK0jk.js","./account-kTnxwOL5.js","./errors-CnHTd7cw.js","./ledger-vCOwyEdk.js","./formValidation-CKylcdjK.js","./themeColorTokens-CToUvU_n.js","./dataExport-DqIFsfq9.js","./appError-CzDbWkbV.js","./accounts-Dk2QA-HD.js","./accounts-Sd-G5BwS.js","./ledgers-D3P1mq-2.js","./categoryNames-BSS7MKSq.js","./categoryEmojis-97W7iB8O.js","./transactions-CE_ZLU3B.js","./dateTime-D4bH2MPn.js"])))=>i.map(i=>d[i]);
import{c as e,i as t,n,t as r}from"./preload-helper-D2yxXLVK.js";import{t as i}from"./react-DAMDAfNa.js";import{t as a}from"./jsx-runtime-Dwpk6tgA.js";import{n as o,t as s}from"./Typography-B_0Lz4TE.js";import{n as c,t as l}from"./TextField-Cc2REYQz.js";import{n as u,t as d}from"./FormControlLabel-B5h8Q2U5.js";import{o as f,r as p}from"./paths-Cn5DhC5u.js";import{F as m,G as h,I as g,W as _,d as v,m as y}from"./iframe-Cm7aR-FA.js";import{n as b,t as x}from"./Chip-DQLaG1Ae.js";import{n as S,t as C}from"./Stack-CedAN9w3.js";import{n as w,t as T}from"./ChevronRightRounded-Ci9Y-4eN.js";import{n as E,t as ee}from"./actionPendingMessages-B03PK8BF.js";import{n as D,t as te}from"./ActionButton-Cz3Eg-x8.js";import{n as ne,t as O}from"./SectionCard-BJDo65kn.js";import{n as re,t as ie}from"./SettingsPageLayout-DQTzm4kM.js";import{n as ae,t as oe}from"./CheckCircleRounded-BC_1VSlS.js";import{n as k,t as se}from"./Switch-DKnl9CEi.js";import{d as ce,f as le,t as A}from"./dataImportExportMessages-Bo9yK0jk.js";import{n as ue,t as de}from"./RadioButtonUncheckedRounded-CzlJ5fqH.js";import{i as j,n as fe,r as pe,t as M}from"./dataExport-DqIFsfq9.js";function N(){let e={transactionAt:`2026-09-19T01:02:03.000Z`,recorderName:`历史记账人`,note:`=原样备注`,merchantId:`shop`};return{accounts:[{id:`cash`,name:`现金`,currency:`JPY`,type:`cash`,holder:{name:`小明`,displayColor:`sky`}},{id:`bank`,name:`存款`,currency:`JPY`,type:`bank`,holder:{name:`小红`,displayColor:`rose`}},{id:`none`,name:`公共账户`,currency:`CNY`,type:`other`,holder:null}],categories:[{id:`food`,name:`🍚 饮食`,parent_id:null,type:`expense`},{id:`lunch`,name:`午餐`,parent_id:`food`,type:`expense`},{id:`salary`,name:`工资`,parent_id:null,type:`income`}],merchants:[{id:`shop`,name:`商家展示名`,tagNames:[`餐饮`,`附近`]}],records:[{...e,id:`normal`,type:`normal`,items:[{categoryId:`lunch`,amount:`123.45`},{categoryId:`food`,amount:`50`},{categoryId:`salary`,amount:`10`}],payments:[{accountId:`cash`,amount:`163.45`}]},{...e,id:`transfer`,type:`transfer`,merchantId:null,items:[{accountId:`bank`,categoryId:null,amount:`300`,balanceDelta:`300`},{accountId:`cash`,categoryId:null,amount:`300`,balanceDelta:`-300`}]},{...e,id:`adjustment`,type:`balance_adjustment`,merchantId:null,items:[{accountId:`none`,categoryId:null,amount:`12.34`,balanceDelta:`-12.34`}]}]}}function me(){return{accounts:[],categories:[],merchants:[],records:[]}}var he=t((()=>{}));function P(e,t=new Date){let n=e=>String(e).padStart(2,`0`),r=`${t.getFullYear()}${n(t.getMonth()+1)}${n(t.getDate())}`,i=`${n(t.getHours())}${n(t.getMinutes())}${n(t.getSeconds())}`;return`KuraNote-${e.replace(/[<>:"/\\|?*\u0000-\u001f]/g,`_`).replace(/[. ]+$/g,``)||`账本`}-${r}-${i}.xlsx`}var F=t((()=>{}));function I(e){let t=(0,L.useRef)(!1),[n,i]=(0,L.useState)(!1),[a,o]=(0,L.useState)(null),[s,c]=(0,L.useState)(null),[l,u]=(0,L.useState)(``),[d,f]=(0,L.useState)(``),[p,m]=(0,L.useState)([`normal`,`transfer`,`balance_adjustment`]),h=p.length>0&&(!l||!d||l<=d);function g(e){m(t=>t.includes(e)?t.filter(t=>t!==e):[...t,e])}let[_,v]=(0,L.useState)(!1),[y,b]=(0,L.useState)(null);async function x(){if(!(t.current||!h)){t.current=!0,i(!0),o(null),c(null),b(null);try{let t=l?new Date(`${l}T00:00:00`):null,n=d?new Date(`${d}T00:00:00`):null;n&&n.setDate(n.getDate()+1);let i=await e({includePhotos:_,recordTypes:p,...t?{dateStart:t.toISOString()}:{},...n?{dateEnd:n.toISOString()}:{}});if(!i.data){o(i.error??j.exportFailed);return}let{buildDataExportWorkbook:a}=await r(async()=>{let{buildDataExportWorkbook:e}=await import(`./dataExportWorkbook-By7EfVAg.js`);return{buildDataExportWorkbook:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21]),import.meta.url),s=_?await a(i.data,{onPhotoProgress:(e,t)=>{t>0&&b({done:e,total:t})}}):await a(i.data),u=new Blob([s],{type:`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`}),f=URL.createObjectURL(u),m=document.createElement(`a`);try{m.href=f;let e=P(i.ledgerName??`账本`);m.download=e,document.body.appendChild(m),m.click(),c(e)}finally{m.remove(),setTimeout(()=>URL.revokeObjectURL(f),1e3)}}catch(e){o(e instanceof pe||e instanceof fe?e.message:j.downloadFailed)}finally{t.current=!1,i(!1),b(null)}}}return{includePhotos:_,setIncludePhotos:v,photoProgress:y,isExporting:n,error:a,downloadedFile:s,startDate:l,setStartDate:u,endDate:d,setEndDate:f,recordTypes:p,toggleRecordType:g,canExport:h,handleExport:x,closeError:()=>o(null)}}var L,ge=t((()=>{L=e(i()),F(),M(),n()}));function R({exportAction:e}){let[t,n]=(0,B.useState)(!1),{includePhotos:r,setIncludePhotos:i,photoProgress:a,isExporting:s,error:l,downloadedFile:d,startDate:p,setStartDate:m,endDate:_,setEndDate:y,recordTypes:x,toggleRecordType:C,canExport:w,handleExport:E,closeError:D}=I(e);return(0,z.jsxs)(ie,{back:{href:f.settingsData,label:ce.backToEntry},title:A.title,subtitle:A.subtitle,children:[(0,z.jsxs)(S,{spacing:2.5,children:[(0,z.jsx)(O,{children:(0,z.jsxs)(S,{spacing:1.5,children:[(0,z.jsx)(o,{sx:{fontWeight:700},children:A.scopeTitle}),(0,z.jsxs)(g,{variant:`outlined`,color:`inherit`,"aria-expanded":t,disabled:s,onClick:()=>n(e=>!e),sx:{justifyContent:`space-between`,textTransform:`none`},endIcon:(0,z.jsx)(T,{}),children:[(0,z.jsx)(`span`,{children:A.dateRange}),(0,z.jsx)(`span`,{children:A.dateSummary(p,_)})]}),t?(0,z.jsxs)(S,{direction:`row`,spacing:1,children:[(0,z.jsx)(c,{fullWidth:!0,size:`small`,type:`date`,label:A.startDate,value:p,onChange:e=>m(e.target.value),disabled:s,slotProps:{inputLabel:{shrink:!0}}}),(0,z.jsx)(c,{fullWidth:!0,size:`small`,type:`date`,label:A.endDate,value:_,onChange:e=>y(e.target.value),disabled:s,slotProps:{inputLabel:{shrink:!0}}})]}):null,(0,z.jsx)(o,{variant:`body2`,children:A.recordTypesTitle}),(0,z.jsx)(S,{direction:`row`,useFlexGap:!0,spacing:.5,sx:{flexWrap:`wrap`},children:[`normal`,`transfer`,`balance_adjustment`].map(e=>{let t=x.includes(e);return(0,z.jsx)(b,{role:`checkbox`,"aria-checked":t,label:A.recordTypes[e],icon:t?(0,z.jsx)(oe,{}):(0,z.jsx)(de,{}),color:t?`success`:`default`,variant:t?`filled`:`outlined`,disabled:s,onClick:()=>C(e)},e)})}),(0,z.jsx)(o,{color:`textSecondary`,variant:`body2`,children:A.scope})]})}),(0,z.jsx)(O,{children:(0,z.jsxs)(S,{spacing:1,children:[(0,z.jsx)(u,{labelPlacement:`start`,sx:{justifyContent:`space-between`,mx:0},control:(0,z.jsx)(k,{checked:r,disabled:s,onChange:(e,t)=>i(t)}),label:A.includePhotos}),r?(0,z.jsx)(o,{color:`textSecondary`,variant:`body2`,children:A.photoSizeHint}):null]})}),(0,z.jsx)(te,{pending:s,pendingLabel:ee.export,disabled:!w,onClick:E,variant:`contained`,fullWidth:!0,children:A.button}),a?(0,z.jsx)(o,{role:`status`,color:`textSecondary`,variant:`body2`,children:A.photoProgress(a.done,a.total)}):null,d?(0,z.jsx)(h,{severity:`success`,children:A.success(d)}):null]}),(0,z.jsx)(v,{open:l!==null,onClose:D,title:A.failureTitle,description:l})]})}var z,B,_e=t((()=>{z=a(),ae(),w(),ue(),m(),x(),l(),_(),d(),se(),C(),s(),D(),E(),le(),p(),y(),ne(),re(),B=e(i()),ge(),R.__docgenInfo={description:``,methods:[],displayName:`DataExportTemplate`,props:{exportAction:{required:!0,tsType:{name:`DataExportAction`},description:``}}}})),V,H,U,W,G,K,q,J,Y,X,Z,Q,$;t((()=>{M(),he(),_e(),{userEvent:V,within:H}=__STORYBOOK_MODULE_TEST__,U=async()=>({data:N()}),W={title:`Templates/Settings/DataExportTemplate`,component:R,args:{exportAction:U}},G=async({canvasElement:e})=>{await V.click(H(e).getByRole(`button`,{name:`导出 Excel`}))},K={name:`默认（可下载示例）`},q={name:`导出照片开关`,play:async({canvasElement:e})=>{await V.click(H(e).getByRole(`switch`,{name:`导出照片`}))}},J={name:`正在准备照片`,args:{exportAction:async()=>({data:{...N(),photos:[{recordId:`normal`,sortOrder:0,fullUrl:`https://example.com/photo.jpg`}]}})},play:async({canvasElement:e})=>{let t=globalThis.fetch;globalThis.fetch=()=>new Promise(()=>{});try{let t=H(e);await V.click(t.getByRole(`switch`,{name:`导出照片`})),await V.click(t.getByRole(`button`,{name:`导出 Excel`})),await t.findByText(`正在准备照片 0/1`)}finally{globalThis.fetch=t}}},Y={name:`导出中`,args:{exportAction:()=>new Promise(()=>{})},play:G},X={name:`导出失败`,args:{exportAction:async()=>({error:j.exportFailed})},play:G},Z={name:`空账本（可下载表头）`,args:{exportAction:async()=>({data:me()})}},Q={name:`已选日期及记录类型`,play:async({canvasElement:e})=>{let t=H(e);await V.click(t.getByRole(`button`,{name:/日期区间/})),await V.click(t.getByRole(`checkbox`,{name:`转账`}))}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  name: "默认（可下载示例）"
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  name: "导出照片开关",
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("switch", {
      name: "导出照片"
    }));
  }
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  name: "正在准备照片",
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
        name: "导出 Excel"
      }));
      await canvas.findByText("正在准备照片 0/1");
    } finally {
      globalThis.fetch = originalFetch;
    }
  }
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "导出中",
  args: {
    exportAction: () => new Promise(() => {})
  },
  play: startExport
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: "导出失败",
  args: {
    exportAction: async () => ({
      error: dataExportErrorMessages.exportFailed
    })
  },
  play: startExport
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  name: "空账本（可下载表头）",
  args: {
    exportAction: async () => ({
      data: createEmptyDataExport()
    })
  }
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  name: "已选日期及记录类型",
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", {
      name: /日期区间/
    }));
    await userEvent.click(canvas.getByRole("checkbox", {
      name: "转账"
    }));
  }
}`,...Q.parameters?.docs?.source}}},$=[`Default`,`IncludePhotos`,`DownloadingPhotos`,`Exporting`,`Failed`,`Empty`,`SelectedRange`]}))();export{K as Default,J as DownloadingPhotos,Z as Empty,Y as Exporting,X as Failed,q as IncludePhotos,Q as SelectedRange,$ as __namedExportsOrder,W as default};