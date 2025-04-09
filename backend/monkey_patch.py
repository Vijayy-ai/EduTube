"""
Monkey patch for inspect.getargspec which was removed in Python 3.11+
This file should be imported before any ThirdWeb imports
"""
import inspect
import functools
import warnings
import collections

# Only add the patch if getargspec doesn't exist
if not hasattr(inspect, 'getargspec'):
    # Create a wrapper around getfullargspec that returns something compatible with the old getargspec
    @functools.wraps(inspect.getfullargspec)
    def getargspec(func):
        warnings.warn(
            "inspect.getargspec() is deprecated since Python 3.0, "
            "use inspect.signature() or inspect.getfullargspec()",
            DeprecationWarning, stacklevel=2
        )
        args, varargs, varkw, defaults, kwonlyargs, kwonlydefaults, annotations = \
            inspect.getfullargspec(func)
        return inspect.ArgSpec(args, varargs, varkw, defaults)

    # Add the backward compatibility class
    if not hasattr(inspect, 'ArgSpec'):
        inspect.ArgSpec = collections.namedtuple('ArgSpec', ['args', 'varargs', 'keywords', 'defaults'])
    
    # Add the function to the inspect module
    inspect.getargspec = getargspec
    
    print("Monkey patch applied: Added inspect.getargspec for ThirdWeb SDK compatibility") 