"""Original cumulative component tasks and behavioral acceptance checks."""
import json
from pathlib import Path
BUILDS=[]
def add(id,title,file,after,task,starter,reference,tests,requires=()):
    BUILDS.append(dict(id=id,title=title,file=file,after=after,task=task,starter=starter,reference=reference,tests=tests,requires=list(requires),minutes=30))

add('tokenizer','Build 1 · Reversible tokenizer','tokenizer.py','decode',
'''Implement encode(tokens,vocab) and decode(ids,vocab) using a token-to-integer map. Preserve order and duplicates; empty input returns []. Unknown entries should raise KeyError rather than silently invent IDs. This component becomes the project's text boundary.''',
'''def encode(tokens, vocab):
    raise NotImplementedError("Implement token lookup")

def decode(ids, vocab):
    raise NotImplementedError("Build and use the inverse map")
''',
'''def encode(tokens, vocab):
    return [vocab[token] for token in tokens]

def decode(ids, vocab):
    inverse = {value:key for key,value in vocab.items()}
    return [inverse[value] for value in ids]
''',
'''from main import encode, decode
vocab = {"red":3,"blue":8,".":1}
assert encode(["red","blue","red"],vocab)==[3,8,3]
assert decode([8,1,3],vocab)==["blue",".","red"]
assert decode(encode(["red","."],vocab),vocab)==["red","."]
assert encode([],vocab)==[] and decode([],vocab)==[]
try: encode(["missing"],vocab)
except KeyError: pass
else: raise AssertionError("Unknown tokens must raise KeyError")
print("Tokenizer: order, duplicates, empty input, unknown token, and round trip passed.")
''')
add('dataset','Build 2 · Next-token dataset','dataset.py','dataloader',
'''Implement windows(ids,length,stride): return pairs of long tensors. Each input has length entries and each target is shifted by one. Include only complete pairs. Also implement make_loader(ids,length,stride,batch_size), returning an ordered DataLoader that keeps its final partial batch. Positive lengths and strides are required; raise ValueError otherwise.''',
'''import torch
from torch.utils.data import DataLoader

def windows(ids, length, stride):
    raise NotImplementedError("Create complete shifted pairs")

def make_loader(ids, length, stride, batch_size):
    raise NotImplementedError("Batch the sample pairs without shuffling")
''',
'''import torch
from torch.utils.data import DataLoader

def windows(ids,length,stride):
    if length <= 0 or stride <= 0:
        raise ValueError("length and stride must be positive")
    return [(torch.tensor(ids[i:i+length],dtype=torch.long),torch.tensor(ids[i+1:i+length+1],dtype=torch.long)) for i in range(0,len(ids)-length,stride)]

def make_loader(ids,length,stride,batch_size):
    return DataLoader(windows(ids,length,stride),batch_size=batch_size,shuffle=False,drop_last=False)
''',
'''import torch
from main import windows, make_loader
pairs=windows([0,1,2,3,4],2,2)
assert len(pairs)==2
assert pairs[1][0].tolist()==[2,3] and pairs[1][1].tolist()==[3,4]
assert pairs[0][0].dtype==torch.long
assert windows([1,2],2,1)==[]
batches=list(make_loader(list(range(8)),2,1,4))
assert [x.shape[0] for x,y in batches]==[4,2]
for args in [(0,1),(2,0)]:
    try: windows([1,2],*args)
    except ValueError: pass
    else: raise AssertionError("Validate length and stride")
print("Dataset: shifted targets, boundaries, dtype, stride, and final batch passed.")
''')
add('attention','Build 3 · Causal multi-head attention','attention.py','merge-heads',
'''Implement attention(q,k,v) for tensors [batch,heads,time,features]. Return scaled causal attention using a future mask before softmax. Q/K feature widths and sequence lengths match; V may have a different feature width. No dropout in this component. Preserve dtype and device when creating the mask.''',
'''import torch

def attention(q, k, v):
    raise NotImplementedError("Scale, mask, normalize, retrieve")
''',
'''import torch

def attention(q,k,v):
    scores = (q @ k.transpose(-2,-1)) / (q.shape[-1] ** 0.5)
    mask = torch.triu(torch.ones(scores.shape[-2:],dtype=torch.bool,device=scores.device),diagonal=1)
    weights = torch.softmax(scores.masked_fill(mask,float("-inf")),dim=-1)
    return weights @ v
''',
'''import torch
from main import attention
torch.manual_seed(42)
q=torch.zeros(1,1,3,2);k=q.clone();v=torch.tensor([[[[3.],[6.],[9.]]]])
torch.testing.assert_close(attention(q,k,v),torch.tensor([[[[3.],[4.5],[6.]]]]))
q=torch.randn(2,3,4,2,requires_grad=True);k=torch.randn(2,3,4,2,requires_grad=True);v=torch.randn(2,3,4,5,requires_grad=True)
out=attention(q,k,v);assert out.shape==(2,3,4,5)
changed=v.detach().clone();changed[:,:,3,:]+=999
torch.testing.assert_close(attention(q,k,changed)[:,:,:3],out[:,:,:3])
out.sum().backward();assert q.grad is not None and k.grad is not None and v.grad is not None
single=attention(torch.zeros(1,1,1,2),torch.zeros(1,1,1,2),torch.ones(1,1,1,3))
torch.testing.assert_close(single,torch.ones(1,1,1,3))
print("Attention: weighted values, shapes, no future leakage, gradients, and one-token case passed.")
''')
GPT='''import torch
from torch import nn
from attention import attention

class Block(nn.Module):
    def __init__(self,width,heads):
        super().__init__()
        self.heads=heads
        self.norm1=nn.LayerNorm(width)
        self.norm2=nn.LayerNorm(width)
        self.q=nn.Linear(width,width)
        self.k=nn.Linear(width,width)
        self.v=nn.Linear(width,width)
        self.out=nn.Linear(width,width)
        self.ff=nn.Sequential(nn.Linear(width,4*width),nn.GELU(approximate="tanh"),nn.Linear(4*width,width))
    def forward(self,x):
        b,t,d=x.shape
        z=self.norm1(x)
        q=self.q(z).reshape(b,t,self.heads,d//self.heads).transpose(1,2)
        k=self.k(z).reshape(b,t,self.heads,d//self.heads).transpose(1,2)
        v=self.v(z).reshape(b,t,self.heads,d//self.heads).transpose(1,2)
        update=attention(q,k,v).transpose(1,2).reshape(b,t,d)
        x=x+self.out(update)
        return x+self.ff(self.norm2(x))

class GPT(nn.Module):
    def __init__(self,vocab_size,context_length,width=16,heads=2,layers=1):
        super().__init__()
        if width % heads or context_length < 1:
            raise ValueError("Invalid model dimensions")
        self.context_length=context_length
        self.token=nn.Embedding(vocab_size,width)
        self.position=nn.Embedding(context_length,width)
        self.blocks=nn.Sequential(*[Block(width,heads) for _ in range(layers)])
        self.norm=nn.LayerNorm(width)
        self.head=nn.Linear(width,vocab_size,bias=False)
    def features(self,ids):
        if ids.shape[1] > self.context_length:
            raise ValueError("Context limit exceeded")
        positions=torch.arange(ids.shape[1],device=ids.device)
        return self.norm(self.blocks(self.token(ids)+self.position(positions)))
    def forward(self,ids):
        return self.head(self.features(ids))
'''
add('gpt','Build 4 · Your GPT architecture','model.py','generation-step',
'''Implement Block(width,heads) and GPT(vocab_size,context_length,width=16,heads=2,layers=1). Use learned token/position embeddings, pre-normalized causal attention, a width→4*width→width GELU feed-forward network, two residual paths per block, final layer norm, and a vocabulary head. GPT.features(ids) returns [batch,time,width]; GPT(ids) returns [batch,time,vocab]. Reject widths not divisible by heads and contexts longer than the configured limit. Import attention from your passed attention.py build. The scaffold supplies the module/container syntax so the work focuses on wiring previously taught components.''',
'''import torch
from torch import nn
from attention import attention

class Block(nn.Module):
    def __init__(self, width, heads):
        super().__init__()
        # Register projections, norms, output projection, and feed-forward layers.
        raise NotImplementedError("Register your block layers")
    def forward(self, x):
        # Split projections into heads, call attention, merge, and add residuals.
        raise NotImplementedError("Connect the block")

class GPT(nn.Module):
    def __init__(self, vocab_size, context_length, width=16, heads=2, layers=1):
        super().__init__()
        # nn.Sequential(*[Block(width,heads) for _ in range(layers)]) stacks blocks.
        # * unpacks the list into positional arguments for Sequential.
        raise NotImplementedError("Register embeddings, blocks, norm, and head")
    def features(self, ids):
        raise NotImplementedError("Compute hidden token features")
    def forward(self, ids):
        raise NotImplementedError("Map features to vocabulary logits")
''',GPT,
'''import torch
from main import GPT
torch.manual_seed(42)
model=GPT(11,8,width=12,heads=3,layers=2).eval()
ids=torch.tensor([[1,2,3,4],[4,3,2,1]])
out=model(ids);assert out.shape==(2,4,11)
assert model.features(ids).shape==(2,4,12)
changed=ids.clone();changed[:,3]=8
torch.testing.assert_close(model(changed)[:,:3],out[:,:3])
out.sum().backward();assert all(p.grad is not None for p in model.parameters())
assert model(torch.tensor([[2]])).shape==(1,1,11)
try: model(torch.ones(1,9,dtype=torch.long))
except ValueError: pass
else: raise AssertionError("Reject context overflow")
try: GPT(11,8,width=7,heads=2)
except ValueError: pass
else: raise AssertionError("Reject indivisible head width")
print("GPT: batched shapes, hidden features, causality, gradients, context and head validation passed.")
''',requires=['attention'])
add('trainer','Build 5 · Train and resume','trainer.py','save-load',
'''Implement train_steps(model,inputs,targets,steps,rate): use AdamW, flatten batch/time for cross-entropy, clear gradients, backward, and step; return a list of loss floats. Implement snapshot(model,optimizer,step) returning a dictionary with cloned model state, optimizer state, and step. Implement restore(model,optimizer,state) to load both states and return step. This lab uses a tiny repeated batch to verify the mechanism, not language quality.''',
'''import copy
import torch
import torch.nn.functional as F

def train_steps(model, inputs, targets, steps, rate):
    raise NotImplementedError("Train on shifted targets")

def snapshot(model, optimizer, step):
    # copy.deepcopy creates independent nested state; .state_dict() alone may alias weights.
    raise NotImplementedError("Capture model, optimizer, and step")

def restore(model, optimizer, state):
    raise NotImplementedError("Restore both states and return step")
''',
'''import copy
import torch
import torch.nn.functional as F

def train_steps(model,inputs,targets,steps,rate):
    model.train()
    optimizer=torch.optim.AdamW(model.parameters(),lr=rate)
    losses=[]
    for _ in range(steps):
        optimizer.zero_grad(set_to_none=True)
        logits=model(inputs)
        loss=F.cross_entropy(logits.reshape(-1,logits.shape[-1]),targets.reshape(-1))
        loss.backward()
        optimizer.step()
        losses.append(loss.item())
    return losses

def snapshot(model,optimizer,step):
    return copy.deepcopy({"model":model.state_dict(),"optimizer":optimizer.state_dict(),"step":step})

def restore(model,optimizer,state):
    model.load_state_dict(state["model"])
    optimizer.load_state_dict(state["optimizer"])
    return state["step"]
''',
'''import torch
from model import GPT
from main import train_steps,snapshot,restore
torch.manual_seed(9);torch.set_num_threads(1)
m=GPT(7,4,width=8,heads=2)
x=torch.tensor([[0,1,2,3]]);y=torch.tensor([[1,2,3,4]])
losses=train_steps(m,x,y,30,0.03)
assert len(losses)==30 and losses[-1] < losses[0]*0.4, "Tiny batch should overfit"
assert train_steps(m,x,y,0,0.01)==[]
opt=torch.optim.AdamW(m.parameters(),lr=0.02)
opt.zero_grad();m(x).sum().backward();opt.step()
state=snapshot(m,opt,13);before={k:v.clone() for k,v in m.state_dict().items()}
with torch.no_grad(): next(m.parameters()).add_(10)
assert all(torch.equal(state["model"][k],v) for k,v in before.items()), "Snapshot must not alias model"
other=GPT(7,4,width=8,heads=2);other_opt=torch.optim.AdamW(other.parameters(),lr=0.5)
assert restore(other,other_opt,state)==13
m.load_state_dict(before);m.eval();other.eval();torch.testing.assert_close(m(x),other(x))
assert other_opt.param_groups[0]["lr"]==0.02 and len(other_opt.state)>0
print("Training: loss reduction, zero steps, independent snapshots, logits and optimizer-state restoration passed.")
''',requires=['attention','gpt'])
add('sampler','Build 6 · Generate with controls','generation.py','stop-eot',
'''Implement generate(model,ids,count,context,temperature=0.,top_k=None,eot=None). Return prompt plus generated IDs. Use greedy argmax when temperature is zero; otherwise optionally filter to top_k and sample from softmax(logits/temperature). Crop only the model input. For this single-example build stop when the generated ID equals eot, keeping that stop token. Restore the model's original training mode afterward. Run without gradient recording.''',
'''import torch

def generate(model, ids, count, context, temperature=0., top_k=None, eot=None):
    raise NotImplementedError("Crop, call, choose, append, repeat")
''',
'''import torch

def generate(model,ids,count,context,temperature=0.,top_k=None,eot=None):
    if context < 1 or temperature < 0 or ids.shape[0] != 1:
        raise ValueError("Use one sequence, positive context, and nonnegative temperature")
    old=model.training
    model.eval()
    try:
        with torch.no_grad():
            for _ in range(count):
                scores=model(ids[:,-context:])[:,-1,:]
                if temperature==0:
                    nxt=scores.argmax(dim=-1,keepdim=True)
                else:
                    if top_k is not None:
                        cutoff=torch.topk(scores,top_k,dim=-1).values[...,-1:]
                        scores=scores.masked_fill(scores<cutoff,float("-inf"))
                    nxt=torch.multinomial(torch.softmax(scores/temperature,dim=-1),1)
                ids=torch.cat([ids,nxt],dim=1)
                if eot is not None and nxt.item()==eot:
                    break
        return ids
    finally:
        model.train(old)
''',
'''import torch
from torch import nn
from main import generate
class Fixed(nn.Module):
    def forward(self,x):
        assert x.shape[1]<=2, "Crop model context"
        assert not torch.is_grad_enabled(), "Generation should disable gradients"
        return torch.tensor([0.,1.,4.]).expand(x.shape[0],x.shape[1],3)
m=Fixed().train();ids=torch.tensor([[0,1,0]])
assert generate(m,ids,3,2).tolist()==[[0,1,0,2,2,2]]
assert m.training, "Restore original model mode"
assert generate(m,ids,5,2,eot=2).tolist()==[[0,1,0,2]]
assert generate(m,ids,2,2,temperature=1.,top_k=1).tolist()==[[0,1,0,2,2]]
assert generate(m,ids,0,2).tolist()==ids.tolist()
print("Generation: context crop, greedy, sampling, stop, zero count, no_grad, and mode restoration passed.")
''')
add('classifier','Build 7 · A classification head','classifier.py','confusion',
'''Implement Classifier(base,width,classes=2): freeze all base parameters, add a trainable nn.Linear head, and classify the final-position features from base.features(ids). forward returns [batch,classes] logits. Set base to eval mode during forward so a frozen model's dropout is disabled. Implement accuracy(logits,labels) as a Python float for a nonempty batch.''',
'''import torch
from torch import nn

class Classifier(nn.Module):
    def __init__(self, base, width, classes=2):
        super().__init__()
        raise NotImplementedError("Freeze base and add head")
    def forward(self, ids):
        raise NotImplementedError("Select features and classify")

def accuracy(logits, labels):
    raise NotImplementedError("Count correct predictions")
''',
'''import torch
from torch import nn

class Classifier(nn.Module):
    def __init__(self,base,width,classes=2):
        super().__init__()
        self.base=base
        for p in base.parameters(): p.requires_grad_(False)
        self.head=nn.Linear(width,classes)
    def forward(self,ids):
        self.base.eval()
        return self.head(self.base.features(ids)[:,-1,:])

def accuracy(logits,labels):
    return (logits.argmax(dim=-1)==labels).float().mean().item()
''',
'''import torch
from model import GPT
from main import Classifier,accuracy
base=GPT(9,4,width=8,heads=2);m=Classifier(base,8)
x=torch.tensor([[1,2],[2,3]])
assert m(x).shape==(2,2)
assert not any(p.requires_grad for p in base.parameters())
assert all(p.requires_grad for p in m.head.parameters())
assert accuracy(torch.tensor([[3.,1.],[3.,1.]]),torch.tensor([0,1]))==0.5
assert accuracy(torch.tensor([[0.,1.]]),torch.tensor([1]))==1.
opt=torch.optim.AdamW(m.parameters(),lr=0.03);before={k:v.clone() for k,v in base.state_dict().items()}
opt.zero_grad();m(x).sum().backward();opt.step()
assert all(torch.equal(v,base.state_dict()[k]) for k,v in before.items())
print("Classifier: logits, trainable head, frozen base, accuracy and update isolation passed.")
''',requires=['attention','gpt'])
add('instructions','Build 8 · Instruction batches','instructions.py','ignore-loss',
'''Implement collate(rows,pad_id): each nonempty row contains prompt+response IDs. Append one end token (pad_id), then create one-token-shifted inputs and targets. Pad to the longest original row length. Keep the first real termination target supervised; only later padding targets become -100. Return two long tensors [batch,max_original_length]. Reject empty batches and empty rows. This component plugs into your trainer and should use cross-entropy's ignore_index=-100.''',
'''import torch

def collate(rows, pad_id):
    raise NotImplementedError("Shift, pad, and preserve the real end target")
''',
'''import torch

def collate(rows,pad_id):
    if not rows or any(not row for row in rows):
        raise ValueError("Rows must be nonempty")
    width=max(len(row) for row in rows)
    inputs=[];targets=[]
    for row in rows:
        seq=list(row)+[pad_id]
        inputs.append(seq[:-1]+[pad_id]*(width-len(row)))
        targets.append(seq[1:]+[-100]*(width-len(row)))
    return torch.tensor(inputs,dtype=torch.long),torch.tensor(targets,dtype=torch.long)
''',
'''import torch
from main import collate
x,y=collate([[1,2,3],[4]],9)
assert x.tolist()==[[1,2,3],[4,9,9]]
assert y.tolist()==[[2,3,9],[9,-100,-100]], "Retain one real end target"
x,y=collate([[2,9],[5,6]],9);assert y.tolist()==[[9,9],[6,9]], "A content ID equal to pad is not automatically invalid"
assert x.dtype==torch.long and y.dtype==torch.long
for rows in [[],[[]]]:
    try:collate(rows,9)
    except ValueError:pass
    else:raise AssertionError("Reject empty rows")
print("Instruction collator: shifted targets, batch padding, real end targets, dtype and empty-input validation passed.")
''')
add('lora','Build 9 · A low-rank adapter','lora.py','adapter-count',
'''Implement LoRALinear(base,rank,scale=1.): freeze an nn.Linear base; register A shaped [in_features,rank] and B shaped [rank,out_features]. Initialize A with small random values and B with zeros so initial output equals base output. forward computes base(x)+scale*(x@A@B). Rank must be positive. Keep the scale convention explicit.''',
'''import torch
from torch import nn

class LoRALinear(nn.Module):
    def __init__(self, base, rank, scale=1.):
        super().__init__()
        raise NotImplementedError("Freeze base; register low-rank factors")
    def forward(self, x):
        raise NotImplementedError("Add the scaled low-rank path")
''',
'''import torch
from torch import nn

class LoRALinear(nn.Module):
    def __init__(self,base,rank,scale=1.):
        super().__init__()
        if rank < 1: raise ValueError("rank must be positive")
        self.base=base
        self.scale=scale
        for p in base.parameters(): p.requires_grad_(False)
        self.A=nn.Parameter(torch.randn(base.in_features,rank)*0.01)
        self.B=nn.Parameter(torch.zeros(rank,base.out_features))
    def forward(self,x):
        return self.base(x)+self.scale*(x @ self.A @ self.B)
''',
'''import torch
from torch import nn
from main import LoRALinear
torch.manual_seed(4);base=nn.Linear(4,3);adapter=LoRALinear(base,2,scale=0.5);x=torch.randn(2,4)
torch.testing.assert_close(adapter(x),base(x))
assert sum(p.numel() for p in adapter.parameters() if p.requires_grad)==14
assert not any(p.requires_grad for p in base.parameters())
with torch.no_grad():adapter.A.fill_(1.);adapter.B.fill_(2.)
torch.testing.assert_close(adapter(x),base(x)+0.5*(x@adapter.A@adapter.B))
adapter(x).sum().backward();assert adapter.A.grad is not None and adapter.B.grad is not None
assert all(p.grad is None for p in base.parameters())
try:LoRALinear(nn.Linear(2,2),0)
except ValueError:pass
else:raise AssertionError("Reject zero rank")
print("LoRA: unchanged initial model, adapter count, scale, gradients and frozen base passed.")
''')
add('pretrained','Build 10 · Map pretrained GPT-2 weights','pretrained.py','weight-map',
"""Implement load_weights(model,weights) for a GPT matching the checkpoint dimensions. The dictionary uses GPT-2 names: wte.weight, wpe.weight, ln_f.weight/bias; h.i.ln_1 and ln_2 weight/bias; h.i.attn.c_attn.weight/bias (Q/K/V concatenated); h.i.attn.c_proj.weight/bias; h.i.mlp.c_fc.weight/bias and c_proj.weight/bias. The c_attn and c_proj/c_fc matrices use [input,output] orientation. Split Q/K/V along output, transpose each, and load every parameter including the vocabulary head from wte.weight. Reject missing names and incompatible shapes. Use torch.no_grad during copies. This lab tests synthetic checkpoints; the exported helper can load real public GPT-2 weights of matching dimensions.""",
"""import torch

def load_weights(model, weights):
    # model.state_dict() supplies named destination tensors; copy_ updates their storage.
    # torch.chunk(tensor,3,dim=1) splits a combined Q/K/V output projection.
    raise NotImplementedError("Map each source name and verify shape before copying")
""",
"""import torch

def load_weights(model,weights):
    state=model.state_dict()
    mapping={"token.weight":weights["wte.weight"],"position.weight":weights["wpe.weight"],"norm.weight":weights["ln_f.weight"],"norm.bias":weights["ln_f.bias"],"head.weight":weights["wte.weight"]}
    for i,block in enumerate(model.blocks):
        prefix=f"h.{i}.";target=f"blocks.{i}."
        for src,dst in [("ln_1","norm1"),("ln_2","norm2")]:
            for part in ["weight","bias"]: mapping[target+dst+"."+part]=weights[prefix+src+"."+part]
        qs,ks,vs=torch.chunk(weights[prefix+"attn.c_attn.weight"],3,dim=1)
        qb,kb,vb=torch.chunk(weights[prefix+"attn.c_attn.bias"],3,dim=0)
        for name,w,b in [("q",qs,qb),("k",ks,kb),("v",vs,vb)]:
            mapping[target+name+".weight"]=w.T
            mapping[target+name+".bias"]=b
        for src,dst in [("attn.c_proj","out"),("mlp.c_fc","ff.0"),("mlp.c_proj","ff.2")]:
            mapping[target+dst+".weight"]=weights[prefix+src+".weight"].T
            mapping[target+dst+".bias"]=weights[prefix+src+".bias"]
    if mapping.keys()!=state.keys(): raise ValueError("Incomplete parameter mapping")
    for name,value in mapping.items():
        if value.shape != state[name].shape: raise ValueError("Shape mismatch: "+name)
    with torch.no_grad():
        for name,value in mapping.items(): state[name].copy_(value)
    return model
""",
"""import torch
from model import GPT
from main import load_weights
torch.manual_seed(12);source=GPT(13,6,width=8,heads=2,layers=2);target=GPT(13,6,width=8,heads=2,layers=2)
s=source.state_dict();weights={"wte.weight":s["token.weight"],"wpe.weight":s["position.weight"],"ln_f.weight":s["norm.weight"],"ln_f.bias":s["norm.bias"]}
for i in range(2):
    p=f"h.{i}.";t=f"blocks.{i}."
    for a,b in [("ln_1","norm1"),("ln_2","norm2")]:
        for part in ["weight","bias"]: weights[p+a+"."+part]=s[t+b+"."+part]
    weights[p+"attn.c_attn.weight"]=torch.cat([s[t+n+".weight"].T for n in ["q","k","v"]],dim=1)
    weights[p+"attn.c_attn.bias"]=torch.cat([s[t+n+".bias"] for n in ["q","k","v"]])
    for a,b in [("attn.c_proj","out"),("mlp.c_fc","ff.0"),("mlp.c_proj","ff.2")]:
        weights[p+a+".weight"]=s[t+b+".weight"].T;weights[p+a+".bias"]=s[t+b+".bias"]
load_weights(target,weights)
expected=dict(s);expected["head.weight"]=s["token.weight"]
for name,value in target.state_dict().items():torch.testing.assert_close(value,expected[name])
try:load_weights(target,{})
except (KeyError,ValueError):pass
else:raise AssertionError("Reject missing weights")
bad=dict(weights);bad["wte.weight"]=torch.zeros(2,2)
try:load_weights(target,bad)
except ValueError:pass
else:raise AssertionError("Reject shape mismatch")
print("Pretrained mapping: every parameter, Q/K/V splits, transpose, vocabulary head, missing and mismatched weights passed.")
""",requires=['attention','gpt'])
add('schedule','Build 11 · Warmup and cosine schedule','schedule.py','clip',
"""Implement learning_rate(step,total,warmup,peak,minimum). For 0 <= step < warmup use peak*step/warmup; thereafter cosine-decay from peak at warmup to minimum at total. Clamp steps beyond total to minimum. Require total>warmup>=0 and step>=0. Also implement clip_gradients(model,max_norm) by calling torch.nn.utils.clip_grad_norm_ after gradients exist. Return the original total norm as a Python float.""",
"""import math
import torch

def learning_rate(step,total,warmup,peak,minimum):
    raise NotImplementedError("Join warmup and cosine decay")

def clip_gradients(model,max_norm):
    raise NotImplementedError("Clip existing parameter gradients")
""",
"""import math
import torch

def learning_rate(step,total,warmup,peak,minimum):
    if not total>warmup>=0 or step<0: raise ValueError("Invalid schedule boundaries")
    if step<warmup:return peak*step/warmup
    progress=min((step-warmup)/(total-warmup),1.)
    return minimum+(peak-minimum)*0.5*(1+math.cos(math.pi*progress))

def clip_gradients(model,max_norm):
    return torch.nn.utils.clip_grad_norm_(model.parameters(),max_norm).item()
""",
"""import math
import torch
from main import learning_rate,clip_gradients
assert learning_rate(0,10,2,0.1,0.01)==0.
assert math.isclose(learning_rate(1,10,2,0.1,0.01),0.05)
assert math.isclose(learning_rate(2,10,2,0.1,0.01),0.1)
assert math.isclose(learning_rate(6,10,2,0.1,0.01),0.055)
assert math.isclose(learning_rate(10,10,2,0.1,0.01),0.01)
assert math.isclose(learning_rate(20,10,2,0.1,0.01),0.01)
assert math.isclose(learning_rate(0,10,0,0.1,0.01),0.1)
m=torch.nn.Linear(2,1,bias=False);m.weight.grad=torch.tensor([[3.,4.]])
assert math.isclose(clip_gradients(m,1.),5.)
assert m.weight.grad.norm().item()<=1.00001
print("Schedule: warmup, boundary, midpoint, end clamp, zero warmup, and gradient-norm clipping passed.")
""")

if __name__=='__main__':
    Path(__file__).with_name('builds.json').write_text(json.dumps(BUILDS,indent=2)+'\n')
    print(f'{len(BUILDS)} cumulative builds authored.')
