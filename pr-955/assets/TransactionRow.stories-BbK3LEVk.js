import{i as e}from"./preload-helper-D2yxXLVK.js";import{t}from"./jsx-runtime-Dwpk6tgA.js";import{n,t as r}from"./Stack-Blj2xom2.js";import{n as i,t as a}from"./Box-BOMx-HAz.js";import{n as o,t as s}from"./Divider-MzIsHye4.js";import{n as c,t as l}from"./TransactionRow-fIicB88w.js";import{a as u,i as d,n as ee,o as f,r as te,s as p,t as ne}from"./transactionRowSharedPayment.testUtils-Gw23C__W.js";var m,h,g,_,v,y,b,x,S,C,w,T,E,D,O,k,A,j,M,N,P,F,I,L,R,z,B,V,H,U,W,G,K,q,J,Y,X,Z,Q,$;e((()=>{m=t(),a(),s(),r(),c(),ne(),h={id:`00000000-0000-4000-8000-000000009001`,type:`expense`,transaction_at:`2026-06-05T10:30:00.000Z`,amount:`2858`,account_name:`💴 日元现金`,account_currency:`JPY`,categoryItems:[{amount:`1280`,categoryName:`🥬 做饭食材/调料`,parentCategoryName:`🍽️ 饮食`,categoryType:`expense`},{amount:`498`,categoryName:`🧃 饮料`,parentCategoryName:`🍽️ 饮食`,categoryType:`expense`},{amount:`324`,categoryName:`🍿 零食`,parentCategoryName:`🍽️ 饮食`,categoryType:`expense`},{amount:`756`,categoryName:`🧴 日常用品`,parentCategoryName:`🏠 生活用品`,categoryType:`expense`}],merchant_name:`業務スーパー`,merchant_icon_url:null,note:`猪肉・鸡腿・蔬菜`},g={id:`00000000-0000-4000-8000-000000009016`,type:`income`,transaction_at:`2026-06-01T00:00:00.000Z`,amount:`323000`,account_name:`💴 日元现金`,account_currency:`JPY`,categoryItems:[{amount:`280000`,categoryName:`💴 工资`,parentCategoryName:`💰 工资收入`,categoryType:`income`},{amount:`15000`,categoryName:`💼 职务手当`,parentCategoryName:`💰 工资收入`,categoryType:`income`},{amount:`20000`,categoryName:`🏠 住房手当`,parentCategoryName:`💰 工资收入`,categoryType:`income`},{amount:`8000`,categoryName:`🚃 通勤手当`,parentCategoryName:`💰 工资收入`,categoryType:`income`}],merchant_name:`株式会社共逹`,merchant_icon_url:null,note:null},_={incomeLinkRole:`refund`,offsetComposition:{refundAmount:`0`,reimbursementAmount:`0`},settlementStatus:null},v={incomeLinkRole:`reimbursement`,offsetComposition:{refundAmount:`0`,reimbursementAmount:`0`},settlementStatus:null},y={...g,amount:`35000`,categoryItems:[{amount:`15000`,businessStatus:_,categoryName:`退款收入`,parentCategoryName:`其他收入`,categoryType:`income`},{amount:`20000`,businessStatus:v,categoryName:`报销收入`,parentCategoryName:`其他收入`,categoryType:`income`}],merchant_name:`关联收入`},b={id:`00000000-0000-4000-8000-000000009003`,type:`transfer`,transaction_at:`2026-06-02T12:54:00.000Z`,amount:`50000`,account_name:`💴 日元现金 → 🏦 储蓄账户`,account_currency:`JPY`,categoryItems:[],merchant_name:null,merchant_icon_url:null,note:null},x={title:`Molecules/Transactions/TransactionRow`,component:l,decorators:[e=>(0,m.jsx)(i,{sx:{bgcolor:`common.white`,minHeight:`100vh`},children:(0,m.jsx)(e,{})})],args:{item:h,receiptCard:!0,showAccount:!0,showTime:!0}},S={name:`普通支出`},C={name:`收入记录`,args:{item:g}},w={name:`退款与报销业务标签`,args:{item:y}},T={name:`有无业务标签时的行高对比`,render:()=>{let e={...h,amount:`220`,categoryItems:[{amount:`220`,businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`0`,reimbursementAmount:`0`},settlementStatus:null},categoryName:`特产`,parentCategoryName:`购物`,categoryType:`expense`}],merchant_name:`Rakuten`,note:`teset`},t={...e,id:`00000000-0000-4000-8000-000000009002`,categoryItems:[{...e.categoryItems[0],businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`0`,reimbursementAmount:`0`},settlementStatus:`reimbursed`}}],merchant_name:`日本铁路`,note:null};return(0,m.jsxs)(n,{divider:(0,m.jsx)(o,{}),children:[(0,m.jsx)(l,{item:e,showTime:!0}),(0,m.jsx)(l,{item:t,showTime:!0})]})}},E={name:`结算状态与退款报销核销构成`,args:{item:{...h,amount:`0`,originalAmount:`2858`,categoryItems:[{...h.categoryItems[0],amount:`2858`,businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`858`,reimbursementAmount:`2000`},settlementStatus:`reimbursed`}}]}}},D={name:`多明细按维度汇总核销构成`,args:{item:{...h,categoryItems:[{...h.categoryItems[0],businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`40`,reimbursementAmount:`0`},settlementStatus:`pendingReimbursement`}},{...h.categoryItems[1],businessStatus:{incomeLinkRole:null,offsetComposition:{refundAmount:`60`,reimbursementAmount:`300`},settlementStatus:`pendingReimbursement`}}]}}},O={name:`单条明细部分已核销`,args:{item:{...h,amount:`1658`,originalAmount:`2858`,categoryItems:[{...h.categoryItems[0],businessNetAmount:`80`},...h.categoryItems.slice(1)]}}},k={name:`部分明细不计入支出`,args:{item:{...h,amount:`1578`,originalAmount:`2858`,categoryItems:[{...h.categoryItems[0],businessNetAmount:`0`},...h.categoryItems.slice(1)]}}},A={name:`完全抵消的退款收入（净额与原金额）`,args:{item:{...y,amount:`0`,originalAmount:`15000`,categoryItems:y.categoryItems.slice(0,1).map(e=>({...e,businessNetAmount:`0`}))}}},j={name:`完全抵消的报销收入（净额与原金额）`,args:{item:{...y,amount:`0`,originalAmount:`20000`,categoryItems:y.categoryItems.slice(1).map(e=>({...e,businessNetAmount:`0`}))}}},M={name:`单账户记录（账户行显示账户名）`,args:{item:{...f,account_name:`我的账户`}}},N={name:`多账户记录（首个账户 等 N 个账户）`,args:{item:f}},P={name:`筛选账户：主金额为本账户份额`,args:{item:te}},F={name:`筛选账户 + 分类：主金额为明细全额，只显示整笔`,args:{item:u}},I={name:`筛选账户 + 按分类：组内行为命中该组的明细全额`,args:{item:d.treatment}},L={name:`按账户分组：组内行为该账户的付款金额`,args:{item:ee.wife}},R={name:`共同支付行与原金额同时出现`,args:{item:p}},z={name:`窄屏下共同支付行换行`,decorators:[e=>(0,m.jsx)(i,{sx:{width:240},children:(0,m.jsx)(e,{})})],args:{item:p}},B={name:`转账记录`,args:{item:b}},V={name:`第二行全部为空`,args:{item:{...h,note:null},showAccount:!1,showTime:!1}},H={name:`无商家`,args:{item:{...h,merchant_name:null,merchant_icon_url:null}}},U={name:`金额为 0`,args:{item:{...h,amount:`0`,categoryItems:[{amount:`0`,categoryName:`💸 金额调整`,parentCategoryName:`📋 其他`,categoryType:`expense`}]}}},W={name:`未来日期`,args:{item:{...h,transaction_at:`2026-12-31T14:30:00.000Z`}}},G={name:`小分类 2 项`,args:{item:{...h,amount:`656`,categoryItems:[{amount:`498`,categoryName:`🍱 便当`,parentCategoryName:`🍽️ 饮食`,categoryType:`expense`},{amount:`158`,categoryName:`🧃 饮料`,parentCategoryName:`🍽️ 饮食`,categoryType:`expense`}]}}},K={name:`小分类 3 项`,args:{item:{...h,amount:`1162`,categoryItems:[{amount:`645`,categoryName:`🥬 做饭食材/调料`,parentCategoryName:`🍽️ 饮食`,categoryType:`expense`},{amount:`328`,categoryName:`🍎 水果`,parentCategoryName:`🍽️ 饮食`,categoryType:`expense`},{amount:`189`,categoryName:`🍿 零食`,parentCategoryName:`🍽️ 饮食`,categoryType:`expense`}]}}},q={name:`小分类 4 项以上（净支出）`,args:{item:{...h}}},J={name:`混合收支（净收入）`,args:{item:{...g,amount:`278800`,categoryItems:[{amount:`1200`,categoryName:`🍜 外食`,parentCategoryName:`🍽️ 饮食`,categoryType:`expense`},{amount:`280000`,categoryName:`💴 工资`,parentCategoryName:`💰 工资收入`,categoryType:`income`}]}}},Y={name:`小分类 4 项以上（净收入）`,args:{item:{...g}}},X={name:`商家名与金额对齐及元信息行间距对比`,render:()=>(0,m.jsxs)(n,{divider:(0,m.jsx)(o,{}),children:[(0,m.jsx)(l,{item:{...h,originalAmount:`3000`},receiptCard:!1,showAccount:!0,showTime:!0}),(0,m.jsx)(l,{item:{...h,originalAmount:`3000`},receiptCard:!0,showAccount:!0,showTime:!0})]})},Z={name:`商家名到元信息行间距对比`,render:()=>{let e={...h,amount:`1578`,originalAmount:`2858`,categoryItems:[{...h.categoryItems[0],businessNetAmount:`0`},...h.categoryItems.slice(1)]},t={...h,account_name:`💴 很长的家庭共同日元现金账户名称`,note:`这是一条很长的备注内容用于对比换行表现`},r=[h,e,t,{...e,account_name:t.account_name,note:t.note}];return(0,m.jsx)(n,{divider:(0,m.jsx)(o,{}),children:r.map(e=>(0,m.jsx)(l,{item:e,receiptCard:!1,showAccount:!0,showTime:!0},`${e.id}-${e.originalAmount??`ordinary`}-${e.account_name}`))})}},Q={name:`长商家名 / 长备注`,args:{item:{...h,merchant_name:`非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常长的商家名称便利店`,note:`这是一条非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常长的备注内容`}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  name: "普通支出"
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  name: "收入记录",
  args: {
    item: incomeItem
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  name: "退款与报销业务标签",
  args: {
    item: businessStatusItem
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  name: "有无业务标签时的行高对比",
  render: () => {
    const categoryOnlyItem: TransactionRowItem = {
      ...expenseItem,
      amount: "220",
      categoryItems: [{
        amount: "220",
        businessStatus: {
          incomeLinkRole: null,
          offsetComposition: {
            refundAmount: "0",
            reimbursementAmount: "0"
          },
          settlementStatus: null
        },
        categoryName: "特产",
        parentCategoryName: "购物",
        categoryType: "expense"
      }],
      merchant_name: "Rakuten",
      note: "teset"
    };
    const businessBadgeItem: TransactionRowItem = {
      ...categoryOnlyItem,
      id: "00000000-0000-4000-8000-000000009002",
      categoryItems: [{
        ...categoryOnlyItem.categoryItems[0],
        businessStatus: {
          incomeLinkRole: null,
          offsetComposition: {
            refundAmount: "0",
            reimbursementAmount: "0"
          },
          settlementStatus: "reimbursed"
        }
      }],
      merchant_name: "日本铁路",
      note: null
    };
    return <Stack divider={<Divider />}>
        <TransactionRow item={categoryOnlyItem} showTime />
        <TransactionRow item={businessBadgeItem} showTime />
      </Stack>;
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  name: "结算状态与退款报销核销构成",
  args: {
    item: {
      ...expenseItem,
      amount: "0",
      originalAmount: "2858",
      categoryItems: [{
        ...expenseItem.categoryItems[0],
        amount: "2858",
        businessStatus: {
          incomeLinkRole: null,
          offsetComposition: {
            refundAmount: "858",
            reimbursementAmount: "2000"
          },
          settlementStatus: "reimbursed"
        }
      }]
    }
  }
}`,...E.parameters?.docs?.source}}},D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  name: "多明细按维度汇总核销构成",
  args: {
    item: {
      ...expenseItem,
      categoryItems: [{
        ...expenseItem.categoryItems[0],
        businessStatus: {
          incomeLinkRole: null,
          offsetComposition: {
            refundAmount: "40",
            reimbursementAmount: "0"
          },
          settlementStatus: "pendingReimbursement"
        }
      }, {
        ...expenseItem.categoryItems[1],
        businessStatus: {
          incomeLinkRole: null,
          offsetComposition: {
            refundAmount: "60",
            reimbursementAmount: "300"
          },
          settlementStatus: "pendingReimbursement"
        }
      }]
    }
  }
}`,...D.parameters?.docs?.source}}},O.parameters={...O.parameters,docs:{...O.parameters?.docs,source:{originalSource:`{
  name: "单条明细部分已核销",
  args: {
    item: {
      ...expenseItem,
      amount: "1658",
      originalAmount: "2858",
      categoryItems: [{
        ...expenseItem.categoryItems[0],
        businessNetAmount: "80"
      }, ...expenseItem.categoryItems.slice(1)]
    }
  }
}`,...O.parameters?.docs?.source}}},k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  name: "部分明细不计入支出",
  args: {
    item: {
      ...expenseItem,
      amount: "1578",
      originalAmount: "2858",
      categoryItems: [{
        ...expenseItem.categoryItems[0],
        businessNetAmount: "0"
      }, ...expenseItem.categoryItems.slice(1)]
    }
  }
}`,...k.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  name: "完全抵消的退款收入（净额与原金额）",
  args: {
    item: {
      ...businessStatusItem,
      amount: "0",
      originalAmount: "15000",
      categoryItems: businessStatusItem.categoryItems.slice(0, 1).map(item => ({
        ...item,
        businessNetAmount: "0"
      }))
    }
  }
}`,...A.parameters?.docs?.source}}},j.parameters={...j.parameters,docs:{...j.parameters?.docs,source:{originalSource:`{
  name: "完全抵消的报销收入（净额与原金额）",
  args: {
    item: {
      ...businessStatusItem,
      amount: "0",
      originalAmount: "20000",
      categoryItems: businessStatusItem.categoryItems.slice(1).map(item => ({
        ...item,
        businessNetAmount: "0"
      }))
    }
  }
}`,...j.parameters?.docs?.source}}},M.parameters={...M.parameters,docs:{...M.parameters?.docs,source:{originalSource:`{
  name: "单账户记录（账户行显示账户名）",
  args: {
    item: {
      ...sharedPaymentRowItem,
      account_name: "我的账户"
    }
  }
}`,...M.parameters?.docs?.source}}},N.parameters={...N.parameters,docs:{...N.parameters?.docs,source:{originalSource:`{
  name: "多账户记录（首个账户 等 N 个账户）",
  args: {
    item: sharedPaymentRowItem
  }
}`,...N.parameters?.docs?.source}}},P.parameters={...P.parameters,docs:{...P.parameters?.docs,source:{originalSource:`{
  name: "筛选账户：主金额为本账户份额",
  args: {
    item: sharedPaymentAccountShareRowItem
  }
}`,...P.parameters?.docs?.source}}},F.parameters={...F.parameters,docs:{...F.parameters?.docs,source:{originalSource:`{
  name: "筛选账户 + 分类：主金额为明细全额，只显示整笔",
  args: {
    item: sharedPaymentMatchedItemsRowItem
  }
}`,...F.parameters?.docs?.source}}},I.parameters={...I.parameters,docs:{...I.parameters?.docs,source:{originalSource:`{
  name: "筛选账户 + 按分类：组内行为命中该组的明细全额",
  args: {
    item: sharedPaymentCategoryGroupRowItems.treatment
  }
}`,...I.parameters?.docs?.source}}},L.parameters={...L.parameters,docs:{...L.parameters?.docs,source:{originalSource:`{
  name: "按账户分组：组内行为该账户的付款金额",
  args: {
    item: sharedPaymentAccountGroupRowItems.wife
  }
}`,...L.parameters?.docs?.source}}},R.parameters={...R.parameters,docs:{...R.parameters?.docs,source:{originalSource:`{
  name: "共同支付行与原金额同时出现",
  args: {
    item: sharedPaymentWithOriginalAmountRowItem
  }
}`,...R.parameters?.docs?.source}}},z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  name: "窄屏下共同支付行换行",
  decorators: [Story => <Box sx={{
    width: 240
  }}>
        <Story />
      </Box>],
  args: {
    item: sharedPaymentWithOriginalAmountRowItem
  }
}`,...z.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  name: "转账记录",
  args: {
    item: transferItem
  }
}`,...B.parameters?.docs?.source}}},V.parameters={...V.parameters,docs:{...V.parameters?.docs,source:{originalSource:`{
  name: "第二行全部为空",
  args: {
    item: {
      ...expenseItem,
      note: null
    },
    showAccount: false,
    showTime: false
  }
}`,...V.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  name: "无商家",
  args: {
    item: {
      ...expenseItem,
      merchant_name: null,
      merchant_icon_url: null
    }
  }
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  name: "金额为 0",
  args: {
    item: {
      ...expenseItem,
      amount: "0",
      categoryItems: [{
        amount: "0",
        categoryName: "💸 金额调整",
        parentCategoryName: "📋 其他",
        categoryType: "expense"
      }]
    }
  }
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  name: "未来日期",
  args: {
    item: {
      ...expenseItem,
      transaction_at: "2026-12-31T14:30:00.000Z"
    }
  }
}`,...W.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
  name: "小分类 2 项",
  args: {
    item: {
      ...expenseItem,
      amount: "656",
      categoryItems: [{
        amount: "498",
        categoryName: "🍱 便当",
        parentCategoryName: "🍽️ 饮食",
        categoryType: "expense"
      }, {
        amount: "158",
        categoryName: "🧃 饮料",
        parentCategoryName: "🍽️ 饮食",
        categoryType: "expense"
      }]
    }
  }
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  name: "小分类 3 项",
  args: {
    item: {
      ...expenseItem,
      amount: "1162",
      categoryItems: [{
        amount: "645",
        categoryName: "🥬 做饭食材/调料",
        parentCategoryName: "🍽️ 饮食",
        categoryType: "expense"
      }, {
        amount: "328",
        categoryName: "🍎 水果",
        parentCategoryName: "🍽️ 饮食",
        categoryType: "expense"
      }, {
        amount: "189",
        categoryName: "🍿 零食",
        parentCategoryName: "🍽️ 饮食",
        categoryType: "expense"
      }]
    }
  }
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  name: "小分类 4 项以上（净支出）",
  args: {
    item: {
      ...expenseItem
    }
  }
}`,...q.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
  name: "混合收支（净收入）",
  args: {
    item: {
      ...incomeItem,
      amount: "278800",
      categoryItems: [{
        amount: "1200",
        categoryName: "🍜 外食",
        parentCategoryName: "🍽️ 饮食",
        categoryType: "expense"
      }, {
        amount: "280000",
        categoryName: "💴 工资",
        parentCategoryName: "💰 工资收入",
        categoryType: "income"
      }]
    }
  }
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  name: "小分类 4 项以上（净收入）",
  args: {
    item: {
      ...incomeItem
    }
  }
}`,...Y.parameters?.docs?.source}}},X.parameters={...X.parameters,docs:{...X.parameters?.docs,source:{originalSource:`{
  name: "商家名与金额对齐及元信息行间距对比",
  render: () => <Stack divider={<Divider />}>
      {/* 同时覆盖真实明细列表的 15px 金额和小票卡片的 18px 金额，
          用于核对第一行文字基线及第一行到 meta 行的垂直间距。 */}
      <TransactionRow item={{
      ...expenseItem,
      originalAmount: "3000"
    }} receiptCard={false} showAccount showTime />
      <TransactionRow item={{
      ...expenseItem,
      originalAmount: "3000"
    }} receiptCard showAccount showTime />
    </Stack>
}`,...X.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  name: "商家名到元信息行间距对比",
  render: () => {
    const adjustedItem: TransactionRowItem = {
      ...expenseItem,
      amount: "1578",
      originalAmount: "2858",
      categoryItems: [{
        ...expenseItem.categoryItems[0],
        businessNetAmount: "0"
      }, ...expenseItem.categoryItems.slice(1)]
    };
    const longMetaItem: TransactionRowItem = {
      ...expenseItem,
      account_name: "💴 很长的家庭共同日元现金账户名称",
      note: "这是一条很长的备注内容用于对比换行表现"
    };
    const comparisonItems: TransactionRowItem[] = [expenseItem, adjustedItem, longMetaItem, {
      ...adjustedItem,
      account_name: longMetaItem.account_name,
      note: longMetaItem.note
    }];
    return <Stack divider={<Divider />}>
        {comparisonItems.map(item => <TransactionRow item={item} key={\`\${item.id}-\${item.originalAmount ?? "ordinary"}-\${item.account_name}\`} receiptCard={false} showAccount showTime />)}
      </Stack>;
  }
}`,...Z.parameters?.docs?.source}}},Q.parameters={...Q.parameters,docs:{...Q.parameters?.docs,source:{originalSource:`{
  name: "长商家名 / 长备注",
  args: {
    item: {
      ...expenseItem,
      merchant_name: "非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常长的商家名称便利店",
      note: "这是一条非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常非常长的备注内容"
    } as TransactionRowItem
  }
}`,...Q.parameters?.docs?.source}}},$=`ExpenseFull.Income.BusinessStatuses.BusinessBadgeHeightComparison.MixedOffsetSettlement.AggregatedOffsetComposition.PartiallyOffset.PartiallyExcluded.FullyOffsetRefundIncome.FullyOffsetReimbursementIncome.SingleAccount.MultipleAccounts.SharedPaymentAccountShare.SharedPaymentMatchedItems.SharedPaymentCategoryGroup.SharedPaymentAccountGroup.SharedPaymentWithOriginalAmount.SharedPaymentNarrow.Transfer.NoMetaRow.NoMerchant.ZeroAmount.FutureDate.TwoCategories.ThreeCategories.ManyExpenseCategories.MixedIncomeNet.ManyIncomeCategories.TitleAlignmentAndMetaSpacingComparison.MerchantToMetaGapComparison.LongText`.split(`.`)}))();export{D as AggregatedOffsetComposition,T as BusinessBadgeHeightComparison,w as BusinessStatuses,S as ExpenseFull,A as FullyOffsetRefundIncome,j as FullyOffsetReimbursementIncome,W as FutureDate,C as Income,Q as LongText,q as ManyExpenseCategories,Y as ManyIncomeCategories,Z as MerchantToMetaGapComparison,J as MixedIncomeNet,E as MixedOffsetSettlement,N as MultipleAccounts,H as NoMerchant,V as NoMetaRow,k as PartiallyExcluded,O as PartiallyOffset,L as SharedPaymentAccountGroup,P as SharedPaymentAccountShare,I as SharedPaymentCategoryGroup,F as SharedPaymentMatchedItems,z as SharedPaymentNarrow,R as SharedPaymentWithOriginalAmount,M as SingleAccount,K as ThreeCategories,X as TitleAlignmentAndMetaSpacingComparison,B as Transfer,G as TwoCategories,U as ZeroAmount,$ as __namedExportsOrder,x as default};