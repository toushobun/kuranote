import{c as e,i as t}from"./preload-helper-D2yxXLVK.js";import{t as n}from"./react-DAMDAfNa.js";import{t as r}from"./jsx-runtime-Dwpk6tgA.js";import{n as i,t as a}from"./iframe-DFQdg-hH.js";import{n as o,t as s}from"./Stack-Blj2xom2.js";import{S as c,y as l}from"./transactions-DpaCUZ3j.js";import{n as u,t as d}from"./Box-B3eRHaD6.js";import{n as f,t as p}from"./Typography-CWKirwdW.js";import{c as m,d as h,i as g,n as _,s as v}from"./paths-D7uT-HPS.js";import{n as y,t as b}from"./Button-DJTTRrLP.js";import{n as x,t as S}from"./link-Du4AGLbo.js";import{n as C,t as ee}from"./PrimaryActionButton-B5c-ckY2.js";import{a as te,c as w,i as ne}from"./OperationFeedbackDialogs-7M_EDITQ.js";import{n as re,t as T}from"./IconButton-C_ZkoDI7.js";import{n as ie,o as ae,s as oe,t as se}from"./DialogContent-DFxsXsGv.js";import{n as ce,t as le}from"./DialogActions-BOHXclwd.js";import{n as ue,t as de}from"./DialogTitle-CWQoKyFu.js";import{n as E,t as fe}from"./bottomNavigationLayout-nTbpdnGy.js";import{_ as pe,g as D,t as O}from"./transaction-Bj-o4QRW.js";import{n as me,t as he}from"./TransactionTypeNavigation-LDJEtDVy.js";import{r as ge,t as _e}from"./userThemeCardSx-vnoApgu-.js";import{n as ve,t as ye}from"./DialogContentText-CvPgR_43.js";import{n as be,r as xe}from"./ErrorState-D4mfh1wq.js";import{n as Se,t as Ce}from"./ArrowBackRounded-CpnRt5D2.js";import{n as we,t as Te}from"./fullViewportPageBackgroundSx-BEsR-Htf.js";import{n as Ee,t as De}from"./LinkedTransactionSyncConfirmationDialog-auXkUm5H.js";import{n as Oe,t as ke}from"./TransactionAmountKeypadLauncher-3GjhHJuS.js";import{o as Ae,r as je,t as Me}from"./TransactionForm.styles-CmZs3pZW.js";import{n as Ne,t as k}from"./TransactionForm-CYqyHaKJ.js";import{n as Pe,t as Fe}from"./EditTransactionDirtyContext-CaDsW0-5.js";import{n as Ie,t as A}from"./TransferTransactionForm-sIp1s0OG.js";function Le(e){let t=new FormData;for(let[n,r]of e.entries())t.append(n,r);return t}function Re(e){let t=(0,j.useRef)(null),[n,r]=(0,j.useState)(null),[i,a,o]=(0,j.useActionState)((0,j.useCallback)(async(n,r)=>{let i=await e(n,r);return i.errorCode===D.linkedSyncConfirmationRequired&&(t.current=Le(r)),i},[e]),{}),s=!!(i!==n&&i.error&&i.errorCode===D.linkedSyncConfirmationRequired),c=!!(i!==n&&i.error&&i.errorCode!==D.linkedSyncConfirmationRequired);function l(){t.current=null,r(i)}function u(){let e=t.current;e&&(e.set(`confirmSync`,`true`),t.current=null,r(i),(0,j.startTransition)(()=>a(e)))}return{cancelConfirmation:l,closeFailure:()=>r(i),confirmSync:u,formAction:a,isConfirmationOpen:s,isFailureOpen:c,isPending:o,state:i}}var j,ze=t((()=>{j=e(n()),O()}));function M(e){return`edit-${e}-transaction-form`}function N(e){if(!e)throw Error(`transactionRecordId is required for edit transaction.`);return e}function Be({activeType:e,panels:t}){let n=(0,L.useRef)(null),r=(0,L.useRef)(null),i=(0,L.useRef)(null),[a,o]=(0,L.useState)(null),s=Qe.indexOf(e);return(0,L.useLayoutEffect)(()=>{function t(){return e===`expense`?n.current:e===`income`?r.current:i.current}let a=t();if(!a)return;function s(){let e=t();e&&o(e.getBoundingClientRect().height)}if(s(),typeof ResizeObserver>`u`)return;let c=new ResizeObserver(s);return c.observe(a),()=>{c.disconnect()}},[e]),(0,I.jsx)(u,{"data-testid":`transaction-type-slide-panels`,sx:e=>({height:a??`auto`,overflow:`hidden`,transition:e.transitions.create(`height`,{duration:e.transitions.duration.shorter,easing:e.transitions.easing.easeInOut}),width:`100%`}),children:(0,I.jsx)(u,{sx:e=>({alignItems:`flex-start`,display:`flex`,transform:`translateX(-${s*100}%)`,transition:e.transitions.create(`transform`,{duration:e.transitions.duration.shorter,easing:e.transitions.easing.easeInOut}),width:`100%`}),children:Qe.map(a=>(0,I.jsx)(u,{ref:a===`expense`?n:a===`income`?r:i,"aria-hidden":a!==e,"data-testid":`transaction-type-slide-panel-${a}`,inert:a===e?void 0:!0,sx:{flex:`0 0 100%`},children:t[a]},a))})})}function Ve(e){return(0,I.jsxs)(I.Fragment,{children:[(0,I.jsx)(Ue,{...e}),(0,I.jsx)(ke,{})]})}function P({operation:e,reason:t=`permission`}){let n=e===`create`?`新增`:`编辑`,r=e===`edit`&&t===`linked`,i=e===`edit`&&t===`archivedAccount`;return(0,I.jsxs)(o,{spacing:2,children:[(0,I.jsx)(We,{title:`${n}记账`}),(0,I.jsx)(be,{title:i||r?`该交易不能编辑`:`无法${n}记账`,description:i?`该交易引用的账户已被删除，请先恢复该账户后再编辑。`:r?`该交易已关联报销或退款，不能编辑。`:`当前账本角色没有${n}记账的权限。`,action:(0,I.jsx)(y,{component:x,href:m.transactions,variant:`outlined`,children:`返回明细`})})]})}function He(e){let t=h(e);return{account:_(t),merchant:v(t)}}function Ue({accountOptions:e,action:t,categoryOptions:n,errorMessage:r,frequentCategoryIds:i,initialType:a,merchantOptions:s,refundPickerView:c,loadRefundGroupItemsAction:l,loadRefundMoreGroupsAction:u,loadRefundSearchPageAction:d,transactionItemSpecialStatusEnabled:f}){let[p,m]=(0,L.useActionState)(t,{}),g=p.error??r,[v,y]=(0,L.useState)(a??`expense`),b=(0,L.useRef)(a===`income`?`income`:`expense`),[,x]=(0,L.useState)({expense:!0,income:!0,transfer:!0});(0,L.useEffect)(()=>{v!==`transfer`&&(b.current=v)},[v]);function S(e){if(e===`normal`){y(b.current);return}y(`transfer`)}let C=(0,L.useMemo)(()=>({expense:(0,I.jsx)(k,{action:m,accountOptions:e,categoryOptions:n,errorMessage:g,frequentCategoryIds:i,formId:`new-expense-transaction-form`,hideHeader:!0,initialType:`expense`,merchantOptions:s,refundPickerView:c,loadRefundGroupItemsAction:l,loadRefundMoreGroupsAction:u,loadRefundSearchPageAction:d,setupHrefs:He(`expense`),transactionItemSpecialStatusEnabled:f,onSubmitDisabledChange:e=>x(t=>({...t,expense:e}))}),income:(0,I.jsx)(k,{action:m,accountOptions:e,categoryOptions:n,errorMessage:g,frequentCategoryIds:i,formId:`new-income-transaction-form`,hideHeader:!0,initialType:`income`,merchantOptions:s,refundPickerView:c,loadRefundGroupItemsAction:l,loadRefundMoreGroupsAction:u,loadRefundSearchPageAction:d,setupHrefs:He(`income`),transactionItemSpecialStatusEnabled:f,onSubmitDisabledChange:e=>x(t=>({...t,income:e}))}),transfer:(0,I.jsx)(A,{action:m,accountOptions:e,addAccountHref:_(h(`transfer`)),errorMessage:g,formId:`new-transfer-transaction-form`,hideHeader:!0,onSubmitDisabledChange:e=>x(t=>({...t,transfer:e}))})}),[m,e,n,i,g,s,c,l,u,d,f]);return(0,I.jsxs)(o,{spacing:0,children:[(0,I.jsx)(We,{title:`记一笔`}),(0,I.jsx)(he,{activeType:v===`transfer`?`transfer`:`normal`,onChange:S}),(0,I.jsx)(Be,{activeType:v,panels:C})]})}function We({hasUnsavedChanges:e=!1,onClose:t,title:n}){return(0,I.jsxs)(u,{sx:et,children:[e&&t?(0,I.jsx)(re,{"aria-label":`关闭`,onClick:t,sx:tt,children:(0,I.jsx)(Ce,{})}):(0,I.jsx)(re,{"aria-label":`关闭`,component:x,href:m.transactions,sx:tt,children:(0,I.jsx)(Ce,{})}),(0,I.jsx)(f,{component:`h1`,variant:`h5`,sx:nt,children:n}),(0,I.jsx)(u,{"aria-hidden":!0,sx:{width:40}})]})}function Ge({activeType:e,deleteAction:t,hasLinkedIncomeItems:n,isSaveConfirmationOpen:r,isSaveFailureOpen:i,isSavePending:a,onCancelSync:s,onCloseSaveFailure:c,onConfirmSync:l,panels:d,saveErrorMessage:f,setActiveType:p,submitDisabledByType:h,transactionRecordId:g}){let[_,v]=(0,L.useActionState)(t,{}),[b,S]=(0,L.useState)(!1),[C,w]=(0,L.useState)(!1),[re,T]=(0,L.useState)(!1),[ae,se]=(0,L.useState)(_),le=(0,L.useRef)(e===`transfer`?`expense`:e),de=e===`transfer`?`transfer`:`normal`,E=(0,L.useCallback)(()=>S(!0),[]);(0,L.useEffect)(()=>{e!==`transfer`&&(le.current=e)},[e]),(0,L.useEffect)(()=>{if(!b)return;function e(e){e.preventDefault(),e.returnValue=``}return window.addEventListener(`beforeunload`,e),()=>window.removeEventListener(`beforeunload`,e)},[b]);function O(e){E(),p(e===`transfer`?`transfer`:le.current)}function me(){let t=document.getElementById(M(e))?.closest(`form`);t instanceof HTMLFormElement&&(w(!1),t.requestSubmit())}function ge(){let e=document.getElementById($e);e instanceof HTMLFormElement&&(T(!1),e.requestSubmit())}return(0,I.jsxs)(Fe,{onDirty:E,children:[(0,I.jsxs)(o,{onChangeCapture:E,spacing:0,children:[(0,I.jsx)(We,{hasUnsavedChanges:b,onClose:()=>w(!0),title:`编辑记账`}),(0,I.jsx)(he,{activeType:de,onChange:O}),(0,I.jsx)(Be,{activeType:e,panels:d}),(0,I.jsxs)(u,{sx:rt,children:[(0,I.jsx)(y,{color:`error`,onClick:()=>T(!0),size:`large`,variant:`outlined`,sx:at,children:`删除`}),(0,I.jsx)(ee,{disabled:h[e]||a,form:M(e),size:`large`,type:`submit`,sx:it,children:`保存修改`})]})]}),(0,I.jsx)(`form`,{action:v,id:$e,children:(0,I.jsx)(`input`,{name:`transactionRecordId`,readOnly:!0,type:`hidden`,value:g})}),(0,I.jsx)(ke,{}),(0,I.jsxs)(oe,{"aria-labelledby":`unsaved-transaction-dialog-title`,onClose:()=>w(!1),open:C,children:[(0,I.jsx)(ue,{id:`unsaved-transaction-dialog-title`,children:`尚未保存`}),(0,I.jsx)(ie,{children:(0,I.jsx)(ve,{children:`修正的内容尚未保存，是否保存？`})}),(0,I.jsxs)(ce,{children:[(0,I.jsx)(y,{onClick:()=>w(!1),children:`继续编辑`}),(0,I.jsx)(y,{component:x,href:m.transactions,color:`error`,children:`放弃修改`}),(0,I.jsx)(y,{onClick:me,variant:`contained`,children:`保存`})]})]}),(0,I.jsx)(ne,{description:n?`删除后这笔记账会从明细页移除，并解除退款 / 报销关联，目标支出的核销净额会相应变化。是否继续？`:`删除后这笔记账会从明细页移除，是否继续？`,onCancel:()=>T(!1),onConfirm:ge,open:re,title:`删除记账？`}),(0,I.jsx)(De,{onCancel:()=>{S(!0),s()},onConfirm:l,open:r}),(0,I.jsx)(te,{bottomOffset:fe.feedbackBottomOffset,description:f,onClose:()=>{S(!0),c()},open:i,title:`保存失败`}),(0,I.jsx)(te,{bottomOffset:fe.feedbackBottomOffset,description:_.error,onClose:()=>se(_),open:!!(_.error&&_!==ae),title:_.errorCode===D.linkedDeleteForbidden?pe.deleteForbidden:`删除失败`})]})}function Ke({accountOptions:e,action:t,categoryOptions:n,deleteAction:r,errorMessage:i,frequentCategoryIds:a,initialValues:o,merchantOptions:s,transactionItemSpecialStatusEnabled:c}){let l=Re(t),u=i,[d,f]=(0,L.useState)(`transfer`),[p,m]=(0,L.useState)({expense:!0,income:!0,transfer:!0}),h=(0,L.useMemo)(()=>({expense:(0,I.jsxs)(I.Fragment,{children:[(0,I.jsx)(`input`,{form:M(`expense`),name:`sourceType`,readOnly:!0,type:`hidden`,value:`transfer`}),(0,I.jsx)(k,{action:l.formAction,accountOptions:e,categoryOptions:n,errorMessage:u,frequentCategoryIds:a,formId:M(`expense`),hideHeader:!0,hideSubmitButton:!0,initialValues:Ye(o,`expense`),merchantOptions:s,transactionItemSpecialStatusEnabled:c,onSubmitDisabledChange:e=>m(t=>({...t,expense:e})),submitLabel:`保存修改`})]}),income:(0,I.jsxs)(I.Fragment,{children:[(0,I.jsx)(`input`,{form:M(`income`),name:`sourceType`,readOnly:!0,type:`hidden`,value:`transfer`}),(0,I.jsx)(k,{action:l.formAction,accountOptions:e,categoryOptions:n,errorMessage:u,frequentCategoryIds:a,formId:M(`income`),hideHeader:!0,hideSubmitButton:!0,initialValues:Ye(o,`income`),merchantOptions:s,transactionItemSpecialStatusEnabled:c,onSubmitDisabledChange:e=>m(t=>({...t,income:e})),submitLabel:`保存修改`})]}),transfer:(0,I.jsx)(A,{action:l.formAction,accountOptions:e,errorMessage:u,formId:M(`transfer`),hideHeader:!0,hideSubmitButton:!0,initialValues:o,onSubmitDisabledChange:e=>m(t=>({...t,transfer:e})),sourceType:`transfer`})}),[l.formAction,e,n,a,u,o,s,c]);return(0,I.jsx)(Ge,{activeType:d,deleteAction:r,hasLinkedIncomeItems:!1,isSaveConfirmationOpen:l.isConfirmationOpen,isSaveFailureOpen:l.isFailureOpen,isSavePending:l.isPending,onCancelSync:l.cancelConfirmation,onCloseSaveFailure:l.closeFailure,onConfirmSync:l.confirmSync,panels:h,saveErrorMessage:l.state.error,setActiveType:f,submitDisabledByType:p,transactionRecordId:N(o.transactionRecordId)})}function F({accountOptions:e,action:t,categoryOptions:n,deleteAction:r,errorMessage:i,frequentCategoryIds:a,initialValues:o,merchantOptions:s,transactionItemSpecialStatusEnabled:c}){let l=Re(t),u=i,[d,f]=(0,L.useState)(o.type),[p,m]=(0,L.useState)({expense:!0,income:!0,transfer:!0}),h=(0,L.useMemo)(()=>({expense:(0,I.jsxs)(I.Fragment,{children:[(0,I.jsx)(`input`,{form:M(`expense`),name:`sourceType`,readOnly:!0,type:`hidden`,value:o.type}),(0,I.jsx)(k,{action:l.formAction,accountOptions:e,categoryOptions:n,errorMessage:u,frequentCategoryIds:a,formId:M(`expense`),hideHeader:!0,hideSubmitButton:!0,initialValues:qe(o,`expense`),merchantOptions:s,transactionItemSpecialStatusEnabled:c,onSubmitDisabledChange:e=>m(t=>({...t,expense:e})),submitLabel:`保存修改`})]}),income:(0,I.jsxs)(I.Fragment,{children:[(0,I.jsx)(`input`,{form:M(`income`),name:`sourceType`,readOnly:!0,type:`hidden`,value:o.type}),(0,I.jsx)(k,{action:l.formAction,accountOptions:e,categoryOptions:n,errorMessage:u,frequentCategoryIds:a,formId:M(`income`),hideHeader:!0,hideSubmitButton:!0,initialValues:qe(o,`income`),merchantOptions:s,transactionItemSpecialStatusEnabled:c,onSubmitDisabledChange:e=>m(t=>({...t,income:e})),submitLabel:`保存修改`})]}),transfer:(0,I.jsx)(A,{action:l.formAction,accountOptions:e,errorMessage:u,formId:M(`transfer`),hideHeader:!0,hideSubmitButton:!0,initialValues:Je(o,e),onSubmitDisabledChange:e=>m(t=>({...t,transfer:e})),sourceType:o.type})}),[l.formAction,e,n,a,u,o,s,c]);return(0,I.jsx)(Ge,{activeType:d,deleteAction:r,hasLinkedIncomeItems:o.items.some(e=>e.businessStatus?.incomeLinkRole!=null),isSaveConfirmationOpen:l.isConfirmationOpen,isSaveFailureOpen:l.isFailureOpen,isSavePending:l.isPending,onCancelSync:l.cancelConfirmation,onCloseSaveFailure:l.closeFailure,onConfirmSync:l.confirmSync,panels:h,saveErrorMessage:l.state.error,setActiveType:f,submitDisabledByType:p,transactionRecordId:N(o.transactionRecordId)})}function qe(e,t){return t===e.type?e:{...e,items:[],type:t}}function Je(e,t){return{accountId:e.accountId,note:e.note,transactionAt:e.transactionAt,transactionRecordId:N(e.transactionRecordId),transferAmount:Xe(e.items,t.find(t=>t.id===e.accountId)?.currency),transferTargetAccountId:Ze(t,e.accountId),type:`transfer`}}function Ye(e,t){return{accountId:e.accountId,items:[],merchantId:``,note:e.note,transactionAt:e.transactionAt,transactionRecordId:e.transactionRecordId,type:t}}function Xe(e,t){let n=e.reduce((e,t)=>{let n=Number(t.amount);return Number.isFinite(n)?e+n:e},0);return n<=0?``:String(Number(n.toFixed(l(t))))}function Ze(e,t){let n=e.find(e=>e.id===t);return e.find(e=>e.id!==t&&e.currency===n?.currency)?.id??``}var I,L,Qe,$e,et,tt,nt,rt,it,at,ot=t((()=>{I=r(),L=e(n()),Se(),d(),b(),ae(),le(),se(),ye(),de(),T(),s(),p(),S(),C(),g(),c(),w(),xe(),E(),O(),me(),Oe(),Pe(),Ee(),Ne(),Me(),Ie(),i(),ze(),Qe=[`expense`,`income`,`transfer`],$e=`delete-transaction-form`,et={alignItems:`center`,display:`grid`,gridTemplateColumns:`40px minmax(0, 1fr) 40px`,pb:1.5,pt:{xs:0,sm:.5}},tt={"@media (hover: hover)":{"&:hover":{bgcolor:`action.hover`}},color:`text.secondary`,justifySelf:`start`},nt={color:`text.primary`,fontSize:`1rem`,fontWeight:800,letterSpacing:0,lineHeight:1.25,textAlign:`center`},rt={display:`grid`,gap:1.25,gridTemplateColumns:`minmax(0, 1fr) minmax(0, 2fr)`,mt:je.gap},it={...Ae,mt:0},at={borderRadius:`${a.radius.md}px`,fontSize:`1rem`,fontWeight:800,minHeight:48},Ve.__docgenInfo={description:``,methods:[],displayName:`NewTransactionTemplate`,props:{accountOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionAccountOption`}],raw:`TransactionAccountOption[]`},description:``},action:{required:!0,tsType:{name:`TransactionStateAction`},description:``},categoryOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionCategoryOption`}],raw:`TransactionCategoryOption[]`},description:``},errorMessage:{required:!0,tsType:{name:`union`,raw:`string | null`,elements:[{name:`string`},{name:`null`}]},description:``},frequentCategoryIds:{required:!0,tsType:{name:`Array`,elements:[{name:`string`}],raw:`string[]`},description:``},initialType:{required:!1,tsType:{name:`TransactionRecordType`},description:``},ledgerName:{required:!0,tsType:{name:`string`},description:``},merchantOptions:{required:!0,tsType:{name:`Array`,elements:[{name:`TransactionMerchantOption`}],raw:`TransactionMerchantOption[]`},description:``},refundPickerView:{required:!1,tsType:{name:`TransactionTimeGroupViewData`},description:``},loadRefundGroupItemsAction:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(
  groupKey: string,
  offset: number,
) => Promise<TransactionMonthPage>`,signature:{arguments:[{type:{name:`string`},name:`groupKey`},{type:{name:`number`},name:`offset`}],return:{name:`Promise`,elements:[{name:`TransactionMonthPage`}],raw:`Promise<TransactionMonthPage>`}}},description:``},loadRefundMoreGroupsAction:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(
  offset: number,
) => Promise<TransactionGroupPage>`,signature:{arguments:[{type:{name:`number`},name:`offset`}],return:{name:`Promise`,elements:[{name:`TransactionGroupPage`}],raw:`Promise<TransactionGroupPage>`}}},description:``},loadRefundSearchPageAction:{required:!1,tsType:{name:`signature`,type:`function`,raw:`(
  query: string,
  offset: number,
) => Promise<TransactionSearchPage>`,signature:{arguments:[{type:{name:`string`},name:`query`},{type:{name:`number`},name:`offset`}],return:{name:`Promise`,elements:[{name:`TransactionSearchPage`}],raw:`Promise<TransactionSearchPage>`}}},description:``},transactionItemSpecialStatusEnabled:{required:!0,tsType:{name:`boolean`},description:``}}},P.__docgenInfo={description:``,methods:[],displayName:`TransactionPermissionDenied`,props:{operation:{required:!0,tsType:{name:`union`,raw:`"edit" | "create"`,elements:[{name:`literal`,value:`"edit"`},{name:`literal`,value:`"create"`}]},description:``},reason:{required:!1,tsType:{name:`union`,raw:`"archivedAccount" | "linked" | "permission"`,elements:[{name:`literal`,value:`"archivedAccount"`},{name:`literal`,value:`"linked"`},{name:`literal`,value:`"permission"`}]},description:``,defaultValue:{value:`"permission"`,computed:!1}}}},Ke.__docgenInfo={description:``,methods:[],displayName:`EditTransferTransactionTemplate`,props:{deleteAction:{required:!0,tsType:{name:`TransactionStateAction`},description:``},initialValues:{required:!0,tsType:{name:`TransferEditInitialValues`},description:``}}},F.__docgenInfo={description:``,methods:[],displayName:`EditTransactionTemplate`,props:{deleteAction:{required:!0,tsType:{name:`TransactionStateAction`},description:``},initialValues:{required:!0,tsType:{name:`TransactionFormInitialValues`},description:``}}}}));function st({children:e}){return(0,ct.jsx)(u,{"data-testid":`transaction-page-frame`,sx:lt,children:e})}var ct,lt,ut=t((()=>{ct=r(),d(),we(),i(),_e(),lt={color:`text.primary`,display:`flex`,flexDirection:`column`,isolation:`isolate`,marginInline:`auto`,maxWidth:480,minWidth:0,position:`relative`,px:{xs:1.5,sm:2},pb:{xs:2,sm:3},pt:{xs:1,sm:1.5},width:`100%`,"&::before":{...Te,content:`""`},"& .MuiToggleButtonGroup-root":{bgcolor:`var(--user-theme-segment-bg)`,border:0,borderRadius:`${a.radius.lg}px`,boxShadow:`none`,gap:0,mb:2,p:.375},"& .MuiToggleButton-root":{border:0,borderRadius:`${a.radius.md}px`,color:`var(--user-theme-segment-text)`,fontSize:`0.875rem`,fontWeight:800,minHeight:34,py:.5},"& .MuiToggleButton-root.Mui-selected":{background:`var(--user-theme-fab-bg)`,boxShadow:`var(--user-theme-card-shadow)`,color:`var(--user-theme-fab-text) !important`},"@media (hover: hover)":{"& .MuiToggleButton-root.Mui-selected:hover":{background:`var(--user-theme-fab-bg)`}},"& .MuiPaper-outlined":{bgcolor:`var(--user-theme-card-bg)`,...ge,borderRadius:`${a.radius.lg}px`,boxShadow:`none`},"& .MuiTextField-root .MuiOutlinedInput-root":{bgcolor:`var(--user-theme-card-bg)`,borderRadius:`${a.radius.md}px`},"& .MuiTextField-root .MuiInputLabel-root":{color:`text.secondary`,fontWeight:700},"& .MuiButton-outlined":{borderColor:`var(--user-theme-field-card-selected-border)`,borderRadius:`${a.radius.md}px`,color:`var(--user-theme-action-text)`,fontWeight:800},"& .MuiButton-contained:not(.Mui-disabled)":{background:`var(--user-theme-fab-bg)`,boxShadow:`0 8px 18px var(--user-theme-fab-shadow)`,color:`var(--user-theme-fab-text)`}},st.__docgenInfo={description:``,methods:[],displayName:`NewTransactionVisualFrame`,props:{children:{required:!0,tsType:{name:`ReactNode`},description:``}}}}));async function R(){return{}}var z,B,V,dt,ft,pt,H,mt,U,W,G,K,q,J,Y,X,Z,Q,$,ht;t((()=>{z=r(),O(),ot(),ut(),{userEvent:B,within:V}=__STORYBOOK_MODULE_TEST__,dt=[{id:`00000000-0000-4000-8000-000000000045`,name:`日元现金`,currency:`JPY`},{id:`00000000-0000-4000-8000-000000000046`,name:`三井住友银行`,currency:`JPY`}],ft=[{id:`00000000-0000-4000-8000-000000005072`,name:`餐饮`,parentId:`00000000-0000-4000-8000-000000005001`,parentName:`食材/调料`,type:`expense`},{id:`00000000-0000-4000-8000-000000005073`,name:`工资`,parentId:`00000000-0000-4000-8000-000000005002`,parentName:`固定收入`,type:`income`}],pt=[{id:`00000000-0000-4000-8000-000000001001`,name:`便利店`,icon_url:null},{id:`00000000-0000-4000-8000-000000001002`,name:`共達`,icon_url:null}],H={accountOptions:dt,action:R,categoryOptions:ft,errorMessage:null,frequentCategoryIds:ft.map(e=>e.id),ledgerName:`家庭账本`,merchantOptions:pt,transactionItemSpecialStatusEnabled:!0},mt={title:`Templates/Transactions/TransactionFormPage`,component:Ve,decorators:[e=>(0,z.jsx)(st,{children:(0,z.jsx)(e,{})})],args:H},U={name:`新增记账页面`},W={name:`含错误提示`,args:{errorMessage:`新增记账失败。请稍后重试。`}},G={name:`无新增权限`,render:()=>(0,z.jsx)(P,{operation:`create`})},K={name:`转账账户已归档`,render:()=>(0,z.jsx)(P,{operation:`edit`,reason:`archivedAccount`})},q={name:`无账户和分类选项`,args:{accountOptions:[],categoryOptions:[],merchantOptions:[]}},J={name:`编辑支出：可切换到转账`,render:()=>(0,z.jsx)(F,{...H,deleteAction:R,initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,items:[{amount:`1200`,categoryId:`00000000-0000-4000-8000-000000005072`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`普通交易编辑示例`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009001`,type:`expense`}})},Y={name:`编辑收入：可切换到转账`,render:()=>(0,z.jsx)(F,{...H,deleteAction:R,initialValues:{accountId:`00000000-0000-4000-8000-000000000046`,items:[{amount:`260000`,categoryId:`00000000-0000-4000-8000-000000005073`}],merchantId:`00000000-0000-4000-8000-000000001002`,note:`收入交易编辑示例`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009002`,type:`income`}})},X={name:`编辑记账：转账类型可切换到支出或收入`,render:()=>(0,z.jsx)(Ke,{...H,deleteAction:R,initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,note:`转账编辑示例`,transactionAt:`2026-06-05T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009003`,transferAmount:`5000`,transferTargetAccountId:`00000000-0000-4000-8000-000000000046`,type:`transfer`}})},Z={name:`编辑已关联支出：可编辑并显示核销结余`,render:()=>(0,z.jsx)(F,{...H,deleteAction:R,initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,items:[{amount:`1200`,businessNetAmount:`-300`,businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`0`,reimbursementAmount:`1500`},settlementStatus:`reimbursementSurplus`},categoryId:`00000000-0000-4000-8000-000000005072`,expectedUpdatedAt:`2026-08-21T01:00:00.000Z`,id:`00000000-0000-4000-8000-000000008001`,specialStatus:`reimbursementSurplus`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`已有关联但仍可修正`,transactionAt:`2026-08-20T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009004`,type:`expense`}})},Q={name:`删除仍被子项关联的母项被拒绝`,render:()=>(0,z.jsx)(F,{...H,deleteAction:async()=>({error:`该交易包含已关联的退款 / 报销明细，请先解除关联后再删除。`,errorCode:D.linkedDeleteForbidden,errorKey:`storybook-linked-delete-forbidden`}),initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,items:[{amount:`1200`,businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`0`,reimbursementAmount:`1200`},settlementStatus:`reimbursed`},categoryId:`00000000-0000-4000-8000-000000005072`,expectedUpdatedAt:`2026-08-21T01:00:00.000Z`,id:`00000000-0000-4000-8000-000000008001`,specialStatus:`reimbursed`}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`删除前需要解除关联`,transactionAt:`2026-08-20T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009005`,type:`expense`}}),play:async({canvasElement:e})=>{let t=V(e);await B.click(await t.findByRole(`button`,{name:`删除`})),await B.click(await V(document.body).findByRole(`button`,{name:`删除`})),await V(document.body).findByText(`无法删除已关联明细`)}},$={name:`删除关联收入时提示自动解除关联`,render:()=>(0,z.jsx)(F,{...H,deleteAction:R,initialValues:{accountId:`00000000-0000-4000-8000-000000000045`,items:[{amount:`1200`,businessStatus:{incomeLinkRole:`reimbursement`,offsetComposition:{refundAmount:`0`,reimbursementAmount:`0`},settlementStatus:null},categoryId:`00000000-0000-4000-8000-000000005073`,expectedUpdatedAt:`2026-08-21T01:00:00.000Z`,id:`00000000-0000-4000-8000-000000008002`,specialStatus:null}],merchantId:`00000000-0000-4000-8000-000000001001`,note:`删除时自动解除关联`,transactionAt:`2026-08-20T03:20:10.000Z`,transactionRecordId:`00000000-0000-4000-8000-000000009006`,type:`income`}}),play:async({canvasElement:e})=>{let t=V(e);await B.click(await t.findByRole(`button`,{name:`删除`})),await V(document.body).findByText(`删除后这笔记账会从明细页移除，并解除退款 / 报销关联，目标支出的核销净额会相应变化。是否继续？`)}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  name: "新增记账页面"
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  name: "含错误提示",
  args: {
    errorMessage: "新增记账失败。请稍后重试。"
  }
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  name: "无新增权限",
  render: () => <TransactionPermissionDenied operation="create" />
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  name: "转账账户已归档",
  render: () => <TransactionPermissionDenied operation="edit" reason="archivedAccount" />
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  name: "无账户和分类选项",
  args: {
    accountOptions: [],
    categoryOptions: [],
    merchantOptions: []
  }
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  name: "编辑支出：可切换到转账",
  render: () => <EditTransactionTemplate {...baseArgs} deleteAction={noopAction} initialValues={{
    accountId: "00000000-0000-4000-8000-000000000045",
    items: [{
      amount: "1200",
      categoryId: "00000000-0000-4000-8000-000000005072"
    }],
    merchantId: "00000000-0000-4000-8000-000000001001",
    note: "普通交易编辑示例",
    transactionAt: "2026-06-05T03:20:10.000Z",
    transactionRecordId: "00000000-0000-4000-8000-000000009001",
    type: "expense"
  }} />
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "编辑收入：可切换到转账",
  render: () => <EditTransactionTemplate {...baseArgs} deleteAction={noopAction} initialValues={{
    accountId: "00000000-0000-4000-8000-000000000046",
    items: [{
      amount: "260000",
      categoryId: "00000000-0000-4000-8000-000000005073"
    }],
    merchantId: "00000000-0000-4000-8000-000000001002",
    note: "收入交易编辑示例",
    transactionAt: "2026-06-05T03:20:10.000Z",
    transactionRecordId: "00000000-0000-4000-8000-000000009002",
    type: "income"
  }} />
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: "编辑记账：转账类型可切换到支出或收入",
  render: () => <EditTransferTransactionTemplate {...baseArgs} deleteAction={noopAction} initialValues={{
    accountId: "00000000-0000-4000-8000-000000000045",
    note: "转账编辑示例",
    transactionAt: "2026-06-05T03:20:10.000Z",
    transactionRecordId: "00000000-0000-4000-8000-000000009003",
    transferAmount: "5000",
    transferTargetAccountId: "00000000-0000-4000-8000-000000000046",
    type: "transfer"
  }} />
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  name: "编辑已关联支出：可编辑并显示核销结余",
  render: () => <EditTransactionTemplate {...baseArgs} deleteAction={noopAction} initialValues={{
    accountId: "00000000-0000-4000-8000-000000000045",
    items: [{
      amount: "1200",
      businessNetAmount: "-300",
      businessStatus: {
        incomeLinkRole: null,
        offsetComposition: {
          refundAmount: "0",
          reimbursementAmount: "1500"
        },
        settlementStatus: "reimbursementSurplus"
      },
      categoryId: "00000000-0000-4000-8000-000000005072",
      expectedUpdatedAt: "2026-08-21T01:00:00.000Z",
      id: "00000000-0000-4000-8000-000000008001",
      specialStatus: "reimbursementSurplus"
    }],
    merchantId: "00000000-0000-4000-8000-000000001001",
    note: "已有关联但仍可修正",
    transactionAt: "2026-08-20T03:20:10.000Z",
    transactionRecordId: "00000000-0000-4000-8000-000000009004",
    type: "expense"
  }} />
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  name: "删除仍被子项关联的母项被拒绝",
  render: () => <EditTransactionTemplate {...baseArgs} deleteAction={async () => ({
    error: "该交易包含已关联的退款 / 报销明细，请先解除关联后再删除。",
    errorCode: transactionErrorCodes.linkedDeleteForbidden,
    errorKey: "storybook-linked-delete-forbidden"
  })} initialValues={{
    accountId: "00000000-0000-4000-8000-000000000045",
    items: [{
      amount: "1200",
      businessStatus: {
        incomeLinkRole: null,
        offsetComposition: {
          refundAmount: "0",
          reimbursementAmount: "1200"
        },
        settlementStatus: "reimbursed"
      },
      categoryId: "00000000-0000-4000-8000-000000005072",
      expectedUpdatedAt: "2026-08-21T01:00:00.000Z",
      id: "00000000-0000-4000-8000-000000008001",
      specialStatus: "reimbursed"
    }],
    merchantId: "00000000-0000-4000-8000-000000001001",
    note: "删除前需要解除关联",
    transactionAt: "2026-08-20T03:20:10.000Z",
    transactionRecordId: "00000000-0000-4000-8000-000000009005",
    type: "expense"
  }} />,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", {
      name: "删除"
    }));
    await userEvent.click(await within(document.body).findByRole("button", {
      name: "删除"
    }));
    await within(document.body).findByText("无法删除已关联明细");
  }
}`,...Q.parameters?.docs?.source}}},$.parameters={...$.parameters,docs:{...$.parameters?.docs,source:{originalSource:`{
  name: "删除关联收入时提示自动解除关联",
  render: () => <EditTransactionTemplate {...baseArgs} deleteAction={noopAction} initialValues={{
    accountId: "00000000-0000-4000-8000-000000000045",
    items: [{
      amount: "1200",
      businessStatus: {
        incomeLinkRole: "reimbursement",
        offsetComposition: {
          refundAmount: "0",
          reimbursementAmount: "0"
        },
        settlementStatus: null
      },
      categoryId: "00000000-0000-4000-8000-000000005073",
      expectedUpdatedAt: "2026-08-21T01:00:00.000Z",
      id: "00000000-0000-4000-8000-000000008002",
      specialStatus: null
    }],
    merchantId: "00000000-0000-4000-8000-000000001001",
    note: "删除时自动解除关联",
    transactionAt: "2026-08-20T03:20:10.000Z",
    transactionRecordId: "00000000-0000-4000-8000-000000009006",
    type: "income"
  }} />,
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button", {
      name: "删除"
    }));
    await within(document.body).findByText("删除后这笔记账会从明细页移除，并解除退款 / 报销关联，目标支出的核销净额会相应变化。是否继续？");
  }
}`,...$.parameters?.docs?.source}}},ht=[`Default`,`WithError`,`PermissionDenied`,`ArchivedAccountPermissionDenied`,`EmptyOptions`,`EditExpenseConvert`,`EditIncomeConvert`,`EditTransferConvert`,`EditLinkedExpense`,`LinkedDeleteForbidden`,`LinkedIncomeDeleteConfirmation`]}))();export{K as ArchivedAccountPermissionDenied,U as Default,J as EditExpenseConvert,Y as EditIncomeConvert,Z as EditLinkedExpense,X as EditTransferConvert,q as EmptyOptions,Q as LinkedDeleteForbidden,$ as LinkedIncomeDeleteConfirmation,G as PermissionDenied,W as WithError,ht as __namedExportsOrder,mt as default};