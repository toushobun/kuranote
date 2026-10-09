import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{E as i,O as a}from"./iframe-6i-fPyFY.js";import{n as o,t as s}from"./Chip-D8tX3z-0.js";import{n as c,t as l}from"./Stack-Blj2xom2.js";import{a as ee}from"./account--_gaLiDT.js";import{t as u}from"./accounts-D1-BAErc.js";import{c as te,i as d,t as ne}from"./paths-D7uT-HPS.js";import{n as f,t as p}from"./UserThemeProvider-pqKi5BSI.js";import{a as re,c as m,s as ie}from"./OperationFeedbackDialogs-B5TlaIvW.js";import{n as h,r as ae,t as oe}from"./bottomNavigationLayout-Bv-2wU-h.js";import{n as g,t as _}from"./AccountForm-D9aLSRH_.js";import{n as v,r as y,t as b}from"./AccountFormDialogShell-BENCBkrA.js";import{n as x,t as se}from"./AccountList-r0J84ZaD.js";import{n as S,t as ce}from"./AccountSummaryCard-CpKMOekP.js";import{n as C,t as le}from"./CreateButton-N5WD9HMz.js";import{n as w,r as ue,t as de}from"./SettingsPageLayout-DL5cl5rh.js";import{n as T,t as E}from"./useClearQueryParam-DOYWmK1F.js";import{n as D,t as O}from"./TransactionAmountKeypadLauncher-9MDIM76Y.js";import{n as k,t as A}from"./accountMessages-0m6WYSVf.js";function j({createAccountAction:e,defaultCurrency:t,holderOptions:n,onClose:r,open:i,placeholderHolderOptions:a=[],returnTo:o=null}){return(0,M.jsx)(v,{illustrationSlot:(0,M.jsx)(b,{}),onClose:r,open:i,children:(0,M.jsx)(_,{createAccountAction:e,defaultCurrency:t,holderOptions:n,onCancel:r,placeholderHolderOptions:a,returnTo:o})})}var M,N=t((()=>{M=r(),g(),y(),j.__docgenInfo={description:``,methods:[],displayName:`AccountCreateDialog`,props:{createAccountAction:{required:!0,tsType:{name:`ServerAction`},description:``},defaultCurrency:{required:!0,tsType:{name:`string`},description:``},holderOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`AccountHolderOption`}],raw:`AccountHolderOption[]`},description:``},onClose:{required:!0,tsType:{name:`signature`,type:`function`,raw:`() => void`,signature:{arguments:[],return:{name:`void`}}},description:``},open:{required:!0,tsType:{name:`boolean`},description:``},placeholderHolderOptions:{required:!1,tsType:{name:`Array`,elements:[{name:`AccountPlaceholderHolderOption`}],raw:`AccountPlaceholderHolderOption[]`},description:``,defaultValue:{value:`[]`,computed:!1}},returnTo:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}}}}}));function P({accounts:e,archiveAccountAction:t,baseCurrency:n,canManageAccounts:r=!0,canWriteTransactions:i=!0,createAccountAction:o,initialErrorKey:s=null,initialErrorMessage:l=null,holderOptions:u,openCreateDialog:d=!1,placeholderHolderOptions:f=[],returnTo:p=null,saveResult:m=null,updateAccountAction:h}){let[g,_]=(0,L.useState)(`all`),v=a(),[y,b]=(0,L.useState)(d&&r),[x,S]=(0,L.useState)(d&&r?p:null),[C,w]=(0,L.useState)([]),E=(0,L.useRef)(0),D=(0,L.useRef)(new Set),[k,M]=(0,L.useState)(m),[N,P]=(0,L.useState)(m!==null),[z,B]=(0,L.useState)(m),[U,W]=(0,L.useActionState)(o,R),[G,K]=(0,L.useActionState)(h,R),[q,J]=(0,L.useActionState)(t,R),Y=T(`result`),X=T(ne,`returnTo`);(0,L.useEffect)(()=>{d&&X()},[d]),(0,L.useEffect)(()=>{let e=[{error:l??void 0,errorKey:s??void 0},U,G,q];for(let t of e){if(!t.error||!t.errorKey||D.current.has(t.errorKey))continue;D.current.add(t.errorKey),E.current+=1;let e=`${t.errorKey}-${E.current}`;w(n=>[...n,{id:e,message:t.error}])}},[q,U,s,l,G]),m!==z&&(B(m),m!==null&&(M(m),P(!0),b(!1),S(null)));let Z=(0,L.useMemo)(()=>g===`all`?e:e.filter(e=>e.type===g),[e,g]),Q=g!==`all`&&Z.length===0,$=H[k??`updated`];function fe(e){w(t=>t.filter(t=>t.id!==e))}function pe(){S(null),b(!0)}function me(){b(!1),x&&(S(null),v.push(x))}function he(){P(!1),Y()}return(0,I.jsxs)(de,{action:r?(0,I.jsx)(le,{onClick:pe,size:`small`,sx:ue,children:A.create}):null,back:{href:te.settings,label:A.backToSettings},subtitle:A.subtitle,title:A.title,children:[(0,I.jsxs)(c,{spacing:1.35,children:[(0,I.jsx)(ce,{accounts:e,baseCurrency:n}),(0,I.jsxs)(c,{direction:`row`,spacing:.7,sx:V,children:[(0,I.jsx)(F,{label:`全部`,selected:g===`all`,onClick:()=>_(`all`)}),ee.filter(e=>e.value!==`other`).map(e=>(0,I.jsx)(F,{label:e.label,selected:g===e.value,onClick:()=>_(e.value)},e.value))]}),(0,I.jsx)(se,{accounts:Z,archiveAccountAction:J,canManageAccounts:r,emptyDescription:Q?`请切换其他账户类型。`:r?void 0:`当前账本还没有可查看的账户。`,emptyTitle:Q?`该类型下还没有账户`:void 0,holderOptions:u,placeholderHolderOptions:f,saveResult:m,updateAccountAction:K})]}),i?(0,I.jsx)(O,{}):null,r?(0,I.jsx)(j,{createAccountAction:W,defaultCurrency:n,holderOptions:u,onClose:me,placeholderHolderOptions:f,open:y,returnTo:x}):null,C.map((e,t)=>(0,I.jsx)(re,{aboveModal:!0,bottomOffset:ae(t),description:e.message,onClose:()=>fe(e.id),open:!0,title:`账户操作失败`},e.id)),(0,I.jsx)(ie,{bottomOffset:oe.feedbackBottomOffset,description:$.description,onClose:he,open:N,title:$.title})]})}function F({label:e,onClick:t,selected:n}){return(0,I.jsx)(o,{clickable:!0,color:n?`warning`:`default`,label:e,onClick:t,sx:[{fontWeight:800},n?B:z],variant:n?`filled`:`outlined`})}var I,L,R,z,B,V,H,U=t((()=>{I=r(),s(),l(),i(),L=e(n()),C(),k(),d(),m(),N(),x(),S(),h(),D(),w(),E(),u(),R={},z={"@media (hover: hover)":{"&&.MuiChip-clickable:hover":{bgcolor:`action.hover`}},"@media (hover: none)":{"&&.MuiChip-clickable":{bgcolor:`transparent`}}},B={"@media (hover: hover)":{"&&.MuiChip-clickable:hover":{bgcolor:`warning.main`}},"@media (hover: none)":{"&&.MuiChip-clickable":{bgcolor:`warning.main`}}},V={flexWrap:`nowrap`,mx:-.5,overflowX:`auto`,px:.5,scrollbarWidth:`none`,"&::-webkit-scrollbar":{display:`none`}},H={archived:{description:`账户已删除，历史记录不会被删除。`,title:`删除成功`},created:{description:`账户已创建。`,title:`新增成功`},updated:{description:`账户修改已保存。`,title:`保存成功`}},P.__docgenInfo={description:``,methods:[],displayName:`AccountsTemplate`,props:{accounts:{required:!0,tsType:{name:`Array`,elements:[{name:`Account`}],raw:`Account[]`},description:``},archiveAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``},baseCurrency:{required:!0,tsType:{name:`string`},description:``},canManageAccounts:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},canWriteTransactions:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`true`,computed:!1}},createAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``},initialErrorKey:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},initialErrorMessage:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},holderOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`AccountHolderOption`}],raw:`AccountHolderOption[]`},description:``},ledgerName:{required:!0,tsType:{name:`string`},description:``},openCreateDialog:{required:!1,tsType:{name:`boolean`},description:``,defaultValue:{value:`false`,computed:!1}},placeholderHolderOptions:{required:!1,tsType:{name:`Array`,elements:[{name:`AccountPlaceholderHolderOption`}],raw:`AccountPlaceholderHolderOption[]`},description:``,defaultValue:{value:`[]`,computed:!1}},returnTo:{required:!1,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},saveResult:{required:!1,tsType:{name:`union`,raw:`AccountSaveResult | null`,elements:[{name:`union`,raw:`"archived" | "created" | "updated"`,elements:[{name:`literal`,value:`"archived"`},{name:`literal`,value:`"created"`},{name:`literal`,value:`"updated"`}]},{name:`null`}]},description:``,defaultValue:{value:`null`,computed:!1}},updateAccountAction:{required:!0,tsType:{name:`AccountStateAction`},description:``}}}})),W,G,K,q,J,Y,X,Z,Q,$;t((()=>{W=r(),f(),U(),G={title:`Templates/Accounts/AccountsTemplate`,component:P,decorators:[e=>(0,W.jsx)(p,{children:(0,W.jsx)(e,{})})],args:{accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,holders:[]}],archiveAccountAction:async()=>({}),baseCurrency:`JPY`,createAccountAction:async()=>({}),holderOptions:[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`}],ledgerName:`家庭账本`,updateAccountAction:async()=>({})}},K={name:`账户页面`},q={name:`无账户`,args:{accounts:[]}},J={name:`错误反馈弹窗`,args:{initialErrorKey:`story-error-key-1`,initialErrorMessage:`账户新增失败。请确认账户名称是否重复，或稍后重试。`}},Y={name:`保存成功反馈`,args:{saveResult:`updated`}},X={name:`新增成功反馈`,args:{saveResult:`created`}},Z={name:`删除成功反馈`,args:{saveResult:`archived`}},Q={name:`多持有人多账户`,args:{holderOptions:[{user_id:`user-1`,display_name:`本地开发用户`,email:`local1@example.test`},{user_id:`user-2`,display_name:`本地开发用户2`,email:`local2@example.test`}],accounts:[{id:`00000000-0000-4000-8000-000000000001`,name:`三菱UFJ银行`,type:`bank`,currency:`JPY`,initial_balance:1e5,current_balance:85e3,sort_order:1,created_at:`2026-01-01T00:00:00.000Z`,holders:[{id:`holder-1`,user_id:`user-1`,kind:`member`,placeholder_id:null,display_name:`本地开发用户`,email:`local1@example.test`,display_color:`sky`,role:`co_owner`,share_ratio:null},{id:`holder-2`,user_id:`user-2`,kind:`member`,placeholder_id:null,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`co_owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000002`,name:`楽天カード`,type:`credit_card`,currency:`JPY`,initial_balance:0,current_balance:-12500,sort_order:2,created_at:`2026-01-02T00:00:00.000Z`,holders:[{id:`holder-3`,user_id:`user-2`,kind:`member`,placeholder_id:null,display_name:`本地开发用户2`,email:`local2@example.test`,display_color:`sakura`,role:`owner`,share_ratio:null}]},{id:`00000000-0000-4000-8000-000000000003`,name:`PayPay`,type:`e_money`,currency:`JPY`,initial_balance:0,current_balance:3200,sort_order:3,created_at:`2026-01-03T00:00:00.000Z`,holders:[]}]}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  name: "账户页面"
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  name: "无账户",
  args: {
    accounts: []
  }
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  name: "错误反馈弹窗",
  args: {
    initialErrorKey: "story-error-key-1",
    initialErrorMessage: "账户新增失败。请确认账户名称是否重复，或稍后重试。"
  }
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "保存成功反馈",
  args: {
    saveResult: "updated"
  }
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: "新增成功反馈",
  args: {
    saveResult: "created"
  }
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  name: "删除成功反馈",
  args: {
    saveResult: "archived"
  }
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  name: "多持有人多账户",
  args: {
    holderOptions: [{
      user_id: "user-1",
      display_name: "本地开发用户",
      email: "local1@example.test"
    }, {
      user_id: "user-2",
      display_name: "本地开发用户2",
      email: "local2@example.test"
    }],
    accounts: [{
      id: "00000000-0000-4000-8000-000000000001",
      name: "三菱UFJ银行",
      type: "bank",
      currency: "JPY",
      initial_balance: 100000,
      current_balance: 85000,
      sort_order: 1,
      created_at: "2026-01-01T00:00:00.000Z",
      holders: [{
        id: "holder-1",
        user_id: "user-1",
        kind: "member" as const,
        placeholder_id: null,
        display_name: "本地开发用户",
        email: "local1@example.test",
        display_color: "sky",
        role: "co_owner",
        share_ratio: null
      }, {
        id: "holder-2",
        user_id: "user-2",
        kind: "member" as const,
        placeholder_id: null,
        display_name: "本地开发用户2",
        email: "local2@example.test",
        display_color: "sakura",
        role: "co_owner",
        share_ratio: null
      }]
    }, {
      id: "00000000-0000-4000-8000-000000000002",
      name: "楽天カード",
      type: "credit_card",
      currency: "JPY",
      initial_balance: 0,
      current_balance: -12500,
      sort_order: 2,
      created_at: "2026-01-02T00:00:00.000Z",
      holders: [{
        id: "holder-3",
        user_id: "user-2",
        kind: "member" as const,
        placeholder_id: null,
        display_name: "本地开发用户2",
        email: "local2@example.test",
        display_color: "sakura",
        role: "owner",
        share_ratio: null
      }]
    }, {
      id: "00000000-0000-4000-8000-000000000003",
      name: "PayPay",
      type: "e_money",
      currency: "JPY",
      initial_balance: 0,
      current_balance: 3200,
      sort_order: 3,
      created_at: "2026-01-03T00:00:00.000Z",
      holders: []
    }]
  }
}`,...Q.parameters?.docs?.source}}},$=[`Default`,`Empty`,`WithError`,`SaveSucceeded`,`CreateSucceeded`,`ArchiveSucceeded`,`MultipleHolders`]}))();export{Z as ArchiveSucceeded,X as CreateSucceeded,K as Default,q as Empty,Q as MultipleHolders,Y as SaveSucceeded,J as WithError,$ as __namedExportsOrder,G as default};