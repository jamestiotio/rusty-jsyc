class VM {

    constructor(){
        this.regs = [];
        this.stack = [];
        this.ops = [];
        this.ops[OP.PROPACCESS] = function(vm) {
            var dst = vm.getByte(), obj = vm.getByte(), prop = vm.getByte();
            obj = vm.getReg(obj);
            prop = vm.getReg(prop);
            vm.setReg(dst, obj[prop]);
        };
        this.ops[OP.LOAD_STRING] = function(vm) {
            var dst = vm.getByte(), str = vm._loadString();
            vm.setReg(dst, str);
        };
        this.ops[OP.LOAD_NUM] = function(vm) {
            var dst = vm.getByte(), val = vm.getByte();
            vm.setReg(dst, val);
        };
        this.ops[OP.FUNC_CALL] = function(vm) {
            var dst = vm.getByte(), func = vm.getByte(), funcThis = vm.getByte(), args = vm._loadArrayFromRegister();
            func = vm.getReg(func);
            funcThis = vm.getReg(funcThis);
            vm.setReg(dst, func.apply(funcThis, args));
        };
        this.ops[OP.EVAL] = function(vm) {
            var dst = vm.getByte(), str = vm.getByte();
            str = vm.getReg(str);
            vm.setReg(dst, eval(str));
        };
        this.ops[OP.CALL_BCFUNC] = function(vm) {
            var funcOffset = vm.getByte();
            vm.setReg(REGS.REG_BACKUP, vm.regs.slice());
            vm.setReg(REGS.STACK_PTR, funcOffset);
        };
        this.ops[OP.RETURN_BCFUNC] = function(vm) {
            var exceptions = [REGS.BCFUNC_RETURN];
            var regBackups = vm.getReg(REGS.REG_BACKUP);
            for (let exception of exceptions) {
                regBackups[exception] = vm.getReg(exception);
            }
            vm.regs = regBackups;
        };
        this.ops[OP.COPY] = function(vm) {
            var dst = vm.getByte(), src = vm.getByte();
            vm.setReg(dst, vm.getReg(src));
        };
        this.ops[OP.EXIT] = function(vm) {
            vm.setReg(REGS.STACK_PTR, vm.stack.length);
        };
        this.ops[OP.COND_JUMP] = function(vm) {
            var cond = vm.getByte(), jump = vm.getByte();
            cond = vm.getReg(cond);
            jump = vm.getReg(jump);
            if (cond) {
                vm.setReg(REGS.STACK_PTR, vm.getReg(REGS.STACK_PTR) + jump);
            }
        };
        this.ops[OP.ADD] = function(vm) {
            var dst = vm.getByte(), src = vm.getByte();
            vm.setReg(dst, vm.regs[dst] + vm.regs[src]);
        };
        this.ops[OP.MUL] = function(vm) {
            var dst = vm.getByte(), src = vm.getByte();
            vm.setReg(dst, vm.regs[dst] * vm.regs[src]);
        };
    }

    setReg(reg, value){
        this.regs[reg] = value;
    }

    getReg(reg){
        return this.regs[reg];
    }

    getByte(){
        return this.stack[this.regs[REGS.STACK_PTR]++];
    }

    run(){
        while (this.regs[REGS.STACK_PTR] < this.stack.length) {
            var op_code = this.getByte();

            var op = this.ops[op_code];

            op(this);
        }
        return this.regs[REGS.RETURN_VAL];
    }

    init(bytecode){
        this.stack = this._decodeBytecode(bytecode);
        this.regs[REGS.STACK_PTR] = 0;
        this.regs[REGS.RETURN_VAL] = 0;
        this.regs[REGS.WINDOW] = window;
        this.regs[REGS.DOCUMENT] = window.document;
        this.regs[REGS.VOID] = void 0;
        this.regs[REGS.EMPTY_OBJ] = {};
    }

    _decodeBytecode(encodedBytecode){
        return encodedBytecode;
    }

    _loadString(){
        var stringLength = this.getByte() << 8 || this.getByte();
        var string = "";
        for (var i = 0;i < stringLength;i++) {
            string += String.fromCharCode(this.getByte());
        }
        return string;
    }

    _loadArrayFromRegister(){
        var arrayLength = this.getByte() << 8 || this.getByte();
        var array = [];
        for (var i = 0;i < arrayLength;i++) {
            array.push(this.getReg(this.getByte()));
        }
        return array;
    }
}

