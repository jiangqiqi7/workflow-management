export const mockData = {
    headerInfo: {
        内镜号: 'AL4876',
        清洗次数: '32',
        上次清洗: '12-23 9:14 李明',
        所属科室: '外科4科',
        上次病人: '李雄 Q76543'
    },

    steps: [
        { id: 1, name: '测漏', status: 'completed' },
        { id: 2, name: '清洗', status: 'completed' },
        { id: 3, name: '漂洗', status: 'active' },
        { id: 4, name: '消毒', status: 'pending' },
        { id: 5, name: '干燥', status: 'pending' }
    ],

    // 提示信息（单一文本数据）
    reviewInfo: {
        message: '提示信息',
        note: "漂洗操作不规范",
    },

    // 操作记录（单独数组，不与提示信息混合）
    reviewRecords: [
        { name: '测漏', checked: true, time: '12-23 10:07 李明' },
        { name: '清洗', checked: true, time: '12-23 10:18 李明' }
    ]
}