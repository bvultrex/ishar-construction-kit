// Import a user-owned unpacked capture with x86:LE:16:Real Mode before running.
// Writes original-derived listings/decompilations ONLY to the supplied local output directory.
// @category Ishar.Reconstruction
import ghidra.app.script.GhidraScript;
import ghidra.app.cmd.disassemble.DisassembleCommand;
import ghidra.app.decompiler.DecompInterface;
import ghidra.app.decompiler.DecompileResults;
import ghidra.program.model.address.*;
import ghidra.program.model.listing.*;
import ghidra.program.model.symbol.SourceType;
import java.io.*;
import java.math.BigInteger;
import java.nio.file.*;
import java.security.MessageDigest;
import java.util.HexFormat;

public class InspectIsharDos extends GhidraScript {
    private String address(int offset) { return String.format("1000:%04x", offset); }
    public void run() throws Exception {
        String[] args=getScriptArgs();
        if(args.length!=1)throw new IllegalArgumentException("Expected local output directory");
        if(!currentProgram.getLanguageID().toString().equals("x86:LE:16:Real Mode"))throw new IllegalStateException("Requires explicit real-mode language");
        Path output=Paths.get(args[0]);Files.createDirectories(output);
        int[][] ranges={{0x2ef3,0x2efe},{0x289c,0x28a8}};
        String[] names={"ishar_opcode71_literal_context_word","ishar_opcode20_jump_if_zero_padded_word"};
        DecompInterface decompiler=new DecompInterface();
        if(!decompiler.openProgram(currentProgram))throw new IllegalStateException("Decompiler did not open program");
        StringBuilder report=new StringBuilder("language="+currentProgram.getLanguageID()+"\n");
        StringBuilder boundaries=new StringBuilder("function,address,length,sha256\n");
        try {
            for(int index=0;index<ranges.length;index++){
                Address start=toAddr(address(ranges[index][0])),end=toAddr(address(ranges[index][1]));
                AddressSet body=new AddressSet(start,end);
                currentProgram.getProgramContext().setValue(currentProgram.getRegister("CS"),start,end,BigInteger.valueOf(0x1000));
                currentProgram.getProgramContext().setValue(currentProgram.getRegister("SS"),start,end,BigInteger.valueOf(0x1c0b));
                DisassembleCommand command=new DisassembleCommand(start,body,true);
                if(!command.applyTo(currentProgram,monitor))throw new IllegalStateException("Disassembly failed: "+names[index]);
                Function function=currentProgram.getFunctionManager().createFunction(names[index],start,body,SourceType.USER_DEFINED);
                if(function==null)throw new IllegalStateException("Function creation failed: "+names[index]);
                int count=0;StringBuilder listing=new StringBuilder();InstructionIterator instructions=currentProgram.getListing().getInstructions(body,true);
                while(instructions.hasNext()){Instruction instruction=instructions.next();listing.append(instruction.getAddress()).append(" ").append(instruction).append("\n");count++;
                    String digest=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(instruction.getBytes()));
                    boundaries.append(names[index]).append(",").append(instruction.getAddress()).append(",").append(instruction.getLength()).append(",").append(digest).append("\n");
                }
                Files.writeString(output.resolve(names[index]+".asm.txt"),listing);
                DecompileResults result=decompiler.decompileFunction(function,30,monitor);
                if(!result.decompileCompleted()||result.getDecompiledFunction()==null)throw new IllegalStateException("Decompiler failed: "+result.getErrorMessage());
                Files.writeString(output.resolve(names[index]+".c.txt"),result.getDecompiledFunction().getC());
                report.append(names[index]).append(" address=").append(start).append(" instructions=").append(count).append(" decompiled=true\n");
            }
        } finally {decompiler.dispose();}
        Files.writeString(output.resolve("summary.txt"),report);Files.writeString(output.resolve("instruction-boundaries.csv"),boundaries);println(report.toString());
    }
}
