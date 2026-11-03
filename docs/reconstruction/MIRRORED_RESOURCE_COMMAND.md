# Mirrored resource command 167

The original handler at engine 1000:33B7 clears SS:C15, reads the context flip at ES:[BP-3], toggles bit zero, stores SS:C12 and joins the five-operand resource path at 337D. This is now reconstructed in the shared resource command implementation and physical script dispatcher. Compound children retain the existing original flip propagation.

Validation: the complete native-dispatch fixture suite now covers commands 72, 73 and 167, both context segments (including the global alias), both flip values, simple and compound resources, allocation, reuse and cleanup. All 216 cases per game passed against the authenticated Ishar 1 and Ishar 2 first-interrupt captures (432 total), comparing six script registers, stack displacement and physical memory excluding CPU stack saves. Typecheck and resource regression checks passed.

This verifies resource-record construction, not mirrored pixels. The mirrored type-20 graphics path and the actual LOGO:008D frame remain the next reconstruction boundary. No original bytes or images are included here.
