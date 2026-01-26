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

// 机洗模式的测试数据
export const mockMachineWashData = {
    base_info: {
        endoscope_id: "0007316094",
        model: "NULL",
        manufacturer: "富士",
        status: "intact",
        total_wash_count: 0
    },
    current_step: {
        sequence_no: "7",
        step_type: "machine_wash",
        device_id: "172.16.77.221",
        operator_id: "0007326306",
        status: "doing"
    },
    alarm_message: "最近没有告警提醒",
    step_records: [
        { sequence_no: "1", status: "finished", step_type: "leak_test" },
        { sequence_no: "2", status: "finished", step_type: "cleaning" },
        { sequence_no: "7", status: "doing", step_type: "machine_wash" }
    ]
}

// 普通模式的测试数据
export const mockNormalWashData = {
    base_info: {
        endoscope_id: "0007316095",
        model: "NULL",
        manufacturer: "富士",
        status: "intact",
        total_wash_count: 0
    },
    current_step: {
        sequence_no: "4",
        step_type: "disfection",
        device_id: "172.16.77.221",
        operator_id: "0007326306",
        status: "doing"
    },
    alarm_message: "最近没有告警提醒",
    step_records: [
        { sequence_no: "1", status: "finished", step_type: "leak_test" },
        { sequence_no: "2", status: "finished", step_type: "cleaning" },
        { sequence_no: "3", status: "finished", step_type: "rinsing" },
        { sequence_no: "4", status: "doing", step_type: "disfection" },
        { sequence_no: "5", status: "pending", step_type: "final_rinsing" },
        { sequence_no: "6", status: "pending", step_type: "drying" }
    ]
}